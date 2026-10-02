import { createBrowserClient } from "@supabase/ssr";
import { backendConfig } from "@/lib/env";
export function createClient() {
  const { url, key } = backendConfig();
  return createBrowserClient(url, key);
}
