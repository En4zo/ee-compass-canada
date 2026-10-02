import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { synchronize } from "@/features/draws/sync";
export const maxDuration = 60;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : "";
  const actual = request.headers.get("authorization") ?? "";
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const client = createAdminClient();
    const count = await synchronize(
      async (draws) => {
        const { data, error } = await client.rpc("import_draws", {
          records: draws,
        });
        if (error) throw new Error(error.message);
        return data as number;
      },
      async (reason) => {
        const { error } = await client.rpc("record_sync_failure", { reason });
        if (error) console.error("Could not record sync failure");
      },
    );
    return NextResponse.json({ ok: true, count });
  } catch {
    return NextResponse.json(
      { error: "Synchronization failed" },
      { status: 502 },
    );
  }
}
