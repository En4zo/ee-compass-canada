import { NextResponse } from "next/server";
import { authenticated, apiError, body } from "@/lib/api";
import { postSchema } from "@/features/forum/schema";
export async function POST(request: Request) {
  try {
    const { client, user } = await authenticated(request);
    const input = postSchema.parse(await body(request));
    const { data, error } = await client
      .from("posts")
      .insert({
        ...input,
        source_url: input.source_url || null,
        author_id: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
