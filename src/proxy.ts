import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasBackend, backendConfig } from "@/lib/env";
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasBackend()) return response;
  const { url, key } = backendConfig();
  const client = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await client.auth.getClaims();
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/cron).*)"],
};
