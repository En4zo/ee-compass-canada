import { describe, it, expect, vi } from "vitest";
import {
  parseDraws,
  fetchOfficialDraws,
  type Draw,
} from "@/features/draws/adapter";
import { synchronize } from "@/features/draws/sync";
import snapshot from "@/data/draws.json";
const row = {
  drawNumber: "91b",
  drawDate: "2018-05-30",
  drawName: "Canadian Experience Class",
  drawSize: "2,000",
  drawCRS: "440",
  drawCutOff: "May 1, 2018 at 00:00:00 UTC",
};
const fetcher = (rows: unknown[]) =>
  vi.fn(
    async () => new Response(JSON.stringify({ rounds: rows }), { status: 200 }),
  ) as typeof fetch;
describe("IRCC adapter and synchronization", () => {
  it("preserves suffix IDs and numeric commas", () =>
    expect(parseDraws({ rounds: [row] })[0]).toMatchObject({
      draw_number: "91b",
      invitations: 2000,
      crs: 440,
    }));
  it("all captured official records satisfy adapter", () => {
    const raw = snapshot.draws.map((d) => ({
      drawNumber: d.draw_number,
      drawDate: d.date,
      drawName: d.round_type,
      drawSize: String(d.invitations),
      drawCRS: String(d.crs),
      drawCutOff: d.tie_breaking ?? "",
    }));
    expect(parseDraws({ rounds: raw }).length).toBe(445);
  });
  it.each([
    { ...row, drawCRS: "1201" },
    { ...row, drawSize: "bad" },
    { ...row, drawDate: "2100-01-01" },
    { ...row, drawDate: "2025-02-30" },
    { ...row, drawName: "" },
  ])("rejects invalid entire batch", (bad) =>
    expect(() => parseDraws({ rounds: [row, bad] })).toThrow(),
  );
  it("rejects duplicates and empty payload", () => {
    expect(() => parseDraws({ rounds: [row, row] })).toThrow();
    expect(() => parseDraws({ rounds: [] })).toThrow();
  });
  it("supports unavailable historical tie-breaking", () =>
    expect(
      parseDraws({ rounds: [{ ...row, drawCutOff: "" }] })[0].tie_breaking,
    ).toBeNull());
  it("never imports malformed batches", async () => {
    const insert = vi.fn(),
      fail = vi.fn();
    await expect(
      synchronize(insert, fail, fetcher([{ ...row, drawCRS: "bad" }])),
    ).rejects.toThrow();
    expect(insert).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledOnce();
  });
  it("records network failure without importing", async () => {
    const insert = vi.fn(),
      fail = vi.fn();
    const network = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(synchronize(insert, fail, network)).rejects.toThrow("offline");
    expect(insert).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledWith("offline");
  });
  it("repeated imports preserve identity", async () => {
    const db = new Map<string, Draw>();
    const insert = async (draws: Draw[]) => {
      draws.forEach((d) => db.set(d.draw_number, d));
      return draws.length;
    };
    await synchronize(insert, vi.fn(), fetcher([row]));
    await synchronize(insert, vi.fn(), fetcher([row]));
    expect(db.size).toBe(1);
  });
  it("rejects upstream HTTP errors", async () => {
    await expect(
      fetchOfficialDraws(
        vi.fn(async () => new Response("Unavailable", { status: 503 })),
      ),
    ).rejects.toThrow("503");
  });
});
