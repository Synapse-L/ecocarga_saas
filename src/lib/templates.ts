import type { SupabaseClient } from '@supabase/supabase-js';

type TemplateRecord = {
  id?: string;
  file_url?: string | null;
  is_default?: boolean | null;
  created_at?: string | null;
};

export async function resolveDefaultTemplateUrl(
  supabaseClient: SupabaseClient,
  userId?: string | null
): Promise<string | null> {
  const resolvedUserId = userId ?? (await supabaseClient.auth.getUser()).data.user?.id ?? null;

  if (!resolvedUserId) {
    return null;
  }

  const { data, error } = await supabaseClient
    .from('templates')
    .select('id, file_url, is_default, created_at')
    .eq('user_id', resolvedUserId)
    .eq('is_default', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  const defaults = (data || []) as TemplateRecord[];

  if (defaults.length > 1) {
    console.warn(
      'Multiple default templates found for the current user. Using the most recently created one.',
      defaults.map(item => item.id)
    );
  }

  const selected = defaults[0];
  if (selected?.file_url) {
    return selected.file_url;
  }

  const { data: latestTemplates, error: latestError } = await supabaseClient
    .from('templates')
    .select('id, file_url, is_default, created_at')
    .eq('user_id', resolvedUserId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (latestError) {
    throw latestError;
  }

  return latestTemplates?.[0]?.file_url ?? null;
}
