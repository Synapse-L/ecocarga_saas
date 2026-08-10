import type { SupabaseClient } from '@supabase/supabase-js';

type TemplateRecord = {
  id?: string;
  file_url?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
};

async function isTemplateUrlReachable(url: string): Promise<boolean> {
  if (!url) return false;

  try {
    const headResponse = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (headResponse.ok) return true;

    const getResponse = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { Range: 'bytes=0-0' }
    });

    return getResponse.ok;
  } catch {
    return false;
  }
}

export async function resolveDefaultTemplateUrl(
  supabaseClient: SupabaseClient,
  userId?: string | null
): Promise<string | undefined> {
  const resolvedUserId = userId ?? (await supabaseClient.auth.getUser()).data.user?.id ?? null;

  if (!resolvedUserId) {
    return undefined;
  }

  const { data, error } = await supabaseClient
    .from('templates')
    .select('id, file_url, is_default, created_at')
    .eq('user_id', resolvedUserId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const templates = (data || []) as TemplateRecord[];
  const defaultTemplates = templates.filter(item => item.is_default);
  const candidates = defaultTemplates.length > 0 ? defaultTemplates : templates;

  for (const candidate of candidates) {
    if (!candidate.file_url) continue;

    const reachable = await isTemplateUrlReachable(candidate.file_url);
    if (reachable) {
      if (candidates.length > 1) {
        console.info('Using reachable template URL from Supabase', candidate.file_url);
      }
      return candidate.file_url;
    }
  }

  const fallback = candidates[0]?.file_url ?? templates[0]?.file_url;
  if (fallback) {
    console.warn('No reachable template URL found among Supabase candidates. Falling back to the latest template row.', fallback);
  }

  return fallback ?? undefined;
}
