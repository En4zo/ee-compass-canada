import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticated, apiError, body } from "@/lib/api";
export async function PATCH(request: Request) {
  try {
    const { client, user } = await authenticated(request);
    const input = z
      .object({ display_name: z.string().trim().min(2).max(40) })
      .parse(await body(request));
    const { error } = await client
      .from("profiles")
      .update(input)
      .eq("id", user.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
