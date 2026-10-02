import "server-only";
import { createClient } from "@supabase/supabase-js";
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !url) throw new Error("Server credentials missing");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
