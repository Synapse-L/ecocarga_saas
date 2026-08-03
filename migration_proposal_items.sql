-- ============================================================
-- MIGRAÇÃO: proposal_items — análise de vendas por carregador
-- EcoCarga SaaS
--
-- COMO RODAR:
-- 1. Acesse o Supabase Dashboard (https://supabase.com)
-- 2. Vá em SQL Editor → New Query
-- 3. Cole todo o conteúdo deste arquivo
-- 4. Clique em "Run" (ou Ctrl+Enter)
--
-- O QUE ESTE ARQUIVO FAZ:
-- Hoje os produtos de uma proposta vivem dentro do JSONB commercial_data, o que
-- serve para gerar o PDF mas não para perguntar "qual carregador mais vende?" —
-- em JSONB isso vira varredura de tabela inteira a cada consulta. Esta migração
-- cria uma linha por produto vendido, indexada e com RLS por usuário, e traz
-- para ela tudo o que já está salvo nas propostas existentes.
--
-- É seguro rodar mais de uma vez: nada é recriado nem duplicado.
-- ============================================================

-- ── 1. Tabela ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Apagou a proposta, somem os itens dela: um item sem proposta não significa
  -- nada e só sujaria os totais dos gráficos.
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,

  -- Vínculo com o catálogo. Fica NULL se o modelo for excluído depois — o
  -- histórico da venda continua de pé, com os dados congelados abaixo.
  charger_model_id UUID REFERENCES charger_models(id) ON DELETE SET NULL,

  -- SNAPSHOT: como o produto estava no momento da venda. Renomear ou
  -- reprecificar um modelo no catálogo não pode reescrever o que já foi vendido.
  nome_snapshot  TEXT NOT NULL,
  potencia_kw    NUMERIC,
  quantidade     INTEGER NOT NULL DEFAULT 1 CHECK (quantidade >= 0),
  preco_unitario NUMERIC NOT NULL DEFAULT 0 CHECK (preco_unitario >= 0),

  -- Coluna gerada, e não gravada pela aplicação: assim o subtotal não tem como
  -- discordar de quantidade × preço. Num relatório de vendas, um subtotal
  -- errado não aparece — só desloca o ranking em silêncio.
  subtotal NUMERIC GENERATED ALWAYS AS (quantidade * preco_unitario) STORED,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE proposal_items IS
  'Uma linha por produto de uma proposta. Espelha commercial_data->commercial->itens, para consulta analítica.';
COMMENT ON COLUMN proposal_items.nome_snapshot IS
  'Nome do produto como estava na venda. Não siga o catálogo: o histórico é congelado.';
COMMENT ON COLUMN proposal_items.subtotal IS
  'Gerado: quantidade * preco_unitario. Não pode ser gravado pela aplicação.';

-- ── 2. Índices ───────────────────────────────────────────────────────────────
-- Os três recortes que o dashboard faz: por usuário, por proposta e por modelo.

CREATE INDEX IF NOT EXISTS proposal_items_user_id_idx          ON proposal_items(user_id);
CREATE INDEX IF NOT EXISTS proposal_items_proposal_id_idx      ON proposal_items(proposal_id);
CREATE INDEX IF NOT EXISTS proposal_items_charger_model_id_idx ON proposal_items(charger_model_id);

-- ── 3. RLS ───────────────────────────────────────────────────────────────────
-- Mesma regra das outras tabelas do projeto: cada um enxerga e mexe só no que
-- é seu. O WITH CHECK é explícito para que ninguém consiga gravar uma linha
-- carimbada com o user_id de outra pessoa.

ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own proposal items" ON proposal_items;
CREATE POLICY "Users can manage own proposal items"
  ON proposal_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Carga inicial a partir das propostas já salvas ────────────────────────
--
-- Sem isto os gráficos nasceriam vazios e só ganhariam conteúdo com as próximas
-- propostas — o histórico de vendas ficaria de fora justamente da tela que
-- existe para olhar o histórico.
--
-- Dois formatos convivem no banco e os dois entram:
--   • propostas novas, com `itens` — uma linha por item;
--   • propostas antigas, sem `itens` — uma linha só, montada dos campos espelho
--     (productName / power / price), que é exatamente o que lerItens() faz na
--     aplicação.

WITH itens_json AS (
  -- Formato novo: um registro por elemento do array `itens`.
  SELECT
    p.id AS proposal_id,
    p.user_id,
    p.created_at,
    elem AS item
  FROM proposals p
  CROSS JOIN LATERAL jsonb_array_elements(p.commercial_data->'commercial'->'itens') AS elem
  WHERE jsonb_typeof(p.commercial_data->'commercial'->'itens') = 'array'
    AND jsonb_array_length(p.commercial_data->'commercial'->'itens') > 0

  UNION ALL

  -- Formato antigo: sem `itens`, ou com a lista vazia. Vira um item de
  -- quantidade 1, cujo preço unitário é o próprio total da proposta.
  SELECT
    p.id,
    p.user_id,
    p.created_at,
    jsonb_build_object(
      'productName', p.commercial_data->'commercial'->>'productName',
      'power',       p.commercial_data->'commercial'->>'power',
      'quantity',    1,
      'unitPrice',   p.commercial_data->'commercial'->'price'
    )
  FROM proposals p
  WHERE CASE
          WHEN jsonb_typeof(p.commercial_data->'commercial'->'itens') = 'array'
          THEN jsonb_array_length(p.commercial_data->'commercial'->'itens')
          ELSE 0
        END = 0
)
INSERT INTO proposal_items (
  proposal_id, user_id, charger_model_id,
  nome_snapshot, potencia_kw, quantidade, preco_unitario, created_at
)
SELECT
  i.proposal_id,
  i.user_id,

  -- Só aproveita o vínculo se for mesmo um UUID e se o modelo ainda existir:
  -- um id solto quebraria a chave estrangeira e derrubaria a migração inteira.
  CASE
    WHEN i.item->>'chargerModelId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
     AND EXISTS (SELECT 1 FROM charger_models cm WHERE cm.id = (i.item->>'chargerModelId')::uuid)
    THEN (i.item->>'chargerModelId')::uuid
  END,

  COALESCE(NULLIF(TRIM(i.item->>'productName'), ''), 'Carregador sem nome'),

  -- "40kW" → 40, "7,4 kW" → 7.4. Pega o primeiro número do texto; se não
  -- houver nenhum, fica NULL em vez de zero, que seria uma potência inventada.
  (regexp_match(replace(COALESCE(i.item->>'power', ''), ',', '.'), '([0-9]+(\.[0-9]+)?)'))[1]::numeric,

  GREATEST(COALESCE(NULLIF(i.item->>'quantity', '')::numeric, 1)::integer, 0),
  GREATEST(COALESCE(NULLIF(i.item->>'unitPrice', '')::numeric, 0), 0),
  i.created_at
FROM itens_json i
-- Idempotência: quem já tem itens não é reprocessado, então rodar o arquivo de
-- novo não duplica nada.
WHERE NOT EXISTS (
  SELECT 1 FROM proposal_items pi WHERE pi.proposal_id = i.proposal_id
);

-- ── 5. Conferência ───────────────────────────────────────────────────────────
-- Some os itens de cada proposta e compara com o total guardado em
-- commercial_data->commercial->price, que é o número que o dashboard e o PDF
-- mostram. O resultado esperado é ZERO linha: qualquer linha aqui é uma
-- proposta cujo total não bate com a soma das partes.

SELECT
  p.id AS proposta_com_divergencia,
  p.title,
  (p.commercial_data->'commercial'->>'price')::numeric AS total_na_proposta,
  SUM(pi.subtotal)                                     AS soma_dos_itens
FROM proposals p
JOIN proposal_items pi ON pi.proposal_id = p.id
GROUP BY p.id, p.title, p.commercial_data
HAVING ABS(
         COALESCE((p.commercial_data->'commercial'->>'price')::numeric, 0)
         - COALESCE(SUM(pi.subtotal), 0)
       ) > 0.01;

-- ✅ Pronto! Cada produto vendido virou uma linha em proposal_items, protegida
--    por RLS. A consulta acima não deve ter devolvido nenhuma proposta.
