import { NextResponse } from "next/server";
import { authenticated, apiError, body } from "@/lib/api";
import { commentSchema } from "@/features/forum/schema";
import { z } from "zod";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { client, user } = await authenticated(request);
    const post_id = z.uuid().parse((await params).id);
    const input = commentSchema.parse(await body(request));
    const { data, error } = await client
      .from("comments")
      .insert({ ...input, post_id, author_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
