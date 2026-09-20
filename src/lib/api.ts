import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { hasBackend } from "./env";
import { createClient } from "./supabase/server";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function authenticated(request?: Request) {
  if (
    request &&
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    throw new HttpError(403, "Invalid origin");
  if (!hasBackend()) throw new HttpError(503, "Backend is not configured");
  const client = await createClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user) throw new HttpError(401, "Please sign in");
  return { client, user };
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (error instanceof ZodError || error instanceof SyntaxError)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  console.error(
    "Request failed",
    error instanceof Error ? error.message : "Database error",
  );
  return NextResponse.json(
    { error: "Unable to complete request" },
    { status: 500 },
  );
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 20000) throw new HttpError(413, "Request too large");
  return JSON.parse(text);
}
