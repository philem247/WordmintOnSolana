import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

let supabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = `https://${projectId}.supabase.co`;
  supabaseClient = createSupabaseClient(supabaseUrl, publicAnonKey);
  
  return supabaseClient;
}

export function getServerUrl(path: string) {
  return `https://${projectId}.supabase.co/functions/v1/make-server-02a4aef8${path}`;
}