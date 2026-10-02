import "server-only";
import snapshot from "@/data/draws.json";
import { hasBackend } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Draw } from "./adapter";
export async function getDraws(): Promise<{
  draws: Draw[];
  demo: boolean;
  updatedAt: string | null;
  checkedAt: string | null;
  syncFailed: boolean;
}> {
  if (!hasBackend())
    return {
      draws: snapshot.draws,
      demo: true,
      updatedAt: snapshot.fetchedAt,
      checkedAt: null,
      syncFailed: false,
    };
  const client = await createClient();
  const { data, error } = await client
    .from("draws")
    .select("*")
    .order("date", { ascending: false })
    .order("draw_number", { ascending: false })
    .limit(1000);
  if (error) throw new Error("Draw data unavailable");
  const { data: status, error: statusError } = await client
    .from("data_status")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (statusError) throw new Error("Sync status unavailable");
  return {
    draws: data as Draw[],
    demo: false,
    updatedAt: status?.last_success_at ?? null,
    checkedAt: status?.last_checked_at ?? null,
    syncFailed: status?.last_status === "failed",
  };
}
