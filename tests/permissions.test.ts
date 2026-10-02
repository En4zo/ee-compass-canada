import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/env", () => ({ hasBackend: () => true }));
import { createClient } from "@/lib/supabase/server";
import { POST as createPost } from "@/app/api/posts/route";
import { POST as moderate } from "@/app/api/admin/moderate/route";
import { GET as sync } from "@/app/api/cron/sync-draws/route";
import { postSchema } from "@/features/forum/schema";
const request = () =>
  new Request("http://localhost/api/posts", {
    method: "POST",
    body: JSON.stringify({
      title: "Valid title",
      body: "Valid post content",
      topic: "CEC",
      kind: "discussion",
    }),
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => vi.clearAllMocks());
describe("API permission gates", () => {
  it("rejects anonymous community writes", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: async () => ({ data: { user: null }, error: null }) },
    } as never);
    expect((await createPost(request())).status).toBe(401);
  });
  it("rejects cross-origin writes", async () => {
    const r = request();
    r.headers.set("origin", "https://evil.example");
    expect((await createPost(r)).status).toBe(403);
    expect(createClient).not.toHaveBeenCalled();
  });
  it("rejects non-admin moderation", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: async () => ({
          data: { user: { id: "user-a" } },
          error: null,
        }),
      },
      rpc: async () => ({ data: false }),
    } as never);
    expect((await moderate(request())).status).toBe(403);
  });
  it("requires cron secret, including when env missing", async () => {
    const previous = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    expect(
      (await sync(new Request("http://localhost/api/cron/sync-draws"))).status,
    ).toBe(401);
    process.env.CRON_SECRET = "test-secret";
    expect(
      (
        await sync(
          new Request("http://localhost/api/cron/sync-draws", {
            headers: { authorization: "Bearer wrong-secret" },
          }),
        )
      ).status,
    ).toBe(401);
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  });
  it("official label cannot use misleading domains", () => {
    for (const url of [
      "not-a-url",
      "https://canada.ca.evil.com/a",
      "https://evil.com/canada.ca",
      "javascript:alert(1)",
    ]) {
      expect(
        postSchema.safeParse({
          title: "Valid title",
          body: "Valid contents here",
          topic: "CEC",
          kind: "official",
          source_url: url,
        }).success,
      ).toBe(false);
    }
    expect(
      postSchema.safeParse({
        title: "Valid title",
        body: "Valid contents here",
        topic: "CEC",
        kind: "official",
        source_url: "https://www.canada.ca/en.html",
      }).success,
    ).toBe(true);
  });
});
