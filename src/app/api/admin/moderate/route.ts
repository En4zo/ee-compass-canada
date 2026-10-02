import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticated, apiError, body, HttpError } from "@/lib/api";
export async function POST(request: Request) {
  try {
    const { client } = await authenticated(request);
    const { data: admin } = await client.rpc("is_admin");
    if (!admin) throw new HttpError(403, "Forbidden");
    const input = z
      .object({
        content_type: z.enum(["posts", "comments"]),
        content_id: z.uuid(),
        hide: z.boolean(),
      })
      .parse(await body(request));
    const { error } = await client.rpc("moderate_content", input);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
