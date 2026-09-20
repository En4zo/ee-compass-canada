import { Account } from "@/features/auth/account";
import { hasBackend } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/features/forum/schema";
export const dynamic = "force-dynamic";
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ auth_error?: string }>;
}) {
  const authError = (await searchParams).auth_error === "1";
  let name = "",
    posts: Post[] = [],
    isAdmin = false;
  if (hasBackend()) {
    const c = await createClient();
    const {
      data: { user },
    } = await c.auth.getUser();
    if (user) {
      const [profile, own, admin] = await Promise.all([
        c.from("profiles").select("display_name").eq("id", user.id).single(),
        c
          .from("posts")
          .select("*,profiles(display_name)")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        c.rpc("is_admin"),
      ]);
      if (profile.error || own.error || admin.error)
        throw new Error("Account unavailable");
      name = profile.data.display_name;
      posts = own.data as Post[];
      isAdmin = Boolean(admin.data);
    }
  }
  return (
    <Account
      key={name}
      name={name}
      posts={posts}
      isAdmin={isAdmin}
      authError={authError}
    />
  );
}
