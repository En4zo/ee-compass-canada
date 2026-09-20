import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { backendConfig } from "@/lib/env";
export async function createClient() {
  const store = await cookies();
  const { url, key } = backendConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server Component 中由 proxy 负责刷新。 */
        }
      },
    },
  });
}
