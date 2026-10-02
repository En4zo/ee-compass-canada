import { hasBackend } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { SetupNotice } from "@/features/forum/forum";
import { Admin } from "@/features/forum/admin";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  if (!hasBackend()) return <SetupNotice />;
  const c = await createClient();
  const {
    data: { user },
  } = await c.auth.getUser();
  if (!user) redirect("/account");
  const { data: allowed } = await c.rpc("is_admin");
  if (!allowed) notFound();
  const [posts, comments, runs] = await Promise.all([
    c
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    c
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
    c
      .from("sync_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);
  if (posts.error || comments.error || runs.error)
    throw new Error("Admin data unavailable");
  return <Admin posts={posts.data} comments={comments.data} runs={runs.data} />;
}
