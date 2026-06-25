const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler chaves de .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSelectTest() {
  console.log('Executando SELECT de teste com a Anon Key...');
  const { data, error } = await supabase
    .from('profiles')
    .select('*');

  if (error) {
    console.error('ERRO DO SUPABASE (SELECT):');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    console.error('Detalhes:', error.details);
    console.error('Dica:', error.hint);
  } else {
    console.log('Sucesso no SELECT! Dados retornados:', data);
  }
}

runSelectTest();
