import "server-only";
import { hasBackend } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { demoPosts } from "./demo";
import type { Post, Comment } from "./schema";
export async function getPosts() {
  if (!hasBackend()) return demoPosts;
  const c = await createClient();
  const { data, error } = await c
    .from("posts")
    .select("*,profiles(display_name)")
    .eq("hidden", false)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("Forum unavailable");
  return data as Post[];
}
export async function getPost(id: string) {
  if (!hasBackend())
    return {
      post: demoPosts.find((p) => p.id === id) ?? null,
      comments: [] as Comment[],
    };
  const c = await createClient();
  const { data: post, error } = await c
    .from("posts")
    .select("*,profiles(display_name)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Post unavailable");
  const { data: comments, error: ce } = await c
    .from("comments")
    .select("*,profiles(display_name)")
    .eq("post_id", id)
    .order("created_at");
  if (ce) throw new Error("Replies unavailable");
  return { post: post as Post | null, comments: comments as Comment[] };
}
