import { NextResponse } from "next/server";
import { authenticated, apiError, body, HttpError } from "@/lib/api";
import { postSchema } from "@/features/forum/schema";
import { z } from "zod";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  try {
    const { client, user } = await authenticated(request);
    const id = z.uuid().parse((await params).id);
    const input = postSchema.parse(await body(request));
    const { data, error } = await client
      .from("posts")
      .update({ ...input, source_url: input.source_url || null })
      .eq("id", id)
      .eq("author_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Post not found or unavailable");
    return NextResponse.json(data);
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    const { client, user } = await authenticated(request);
    const id = z.uuid().parse((await params).id);
    const { data, error } = await client
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new HttpError(404, "Post not found");
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
