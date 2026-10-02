import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
let db: PGlite;
const alice = "00000000-0000-4000-8000-000000000001",
  bob = "00000000-0000-4000-8000-000000000002";
let postId: string;
async function asUser<T>(id: string | null, run: () => Promise<T>) {
  await db.exec(
    `set role ${id ? "authenticated" : "anon"}; select set_config('request.jwt.claim.sub','${id ?? ""}',false);`,
  );
  try {
    return await run();
  } finally {
    await db.exec("reset role;");
  }
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`,
  );
  await db.exec(
    await readFile(
      new URL("../supabase/migrations/001_initial.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.query("insert into auth.users(id) values($1),($2)", [alice, bob]);
  const p = await asUser(alice, () =>
    db.query<{ id: string }>(
      "insert into public.posts(author_id,title,body,topic,kind) values($1,'Test title','Test body with enough detail','CEC','discussion') returning id",
      [alice],
    ),
  );
  postId = p.rows[0].id;
}, 30000);
afterAll(async () => {
  await db.close();
});
describe("PostgreSQL migration and RLS", () => {
  it("allows anonymous public reads", async () => {
    expect(
      (await asUser(null, () => db.query("select * from public.posts"))).rows,
    ).toHaveLength(1);
  });
  it("denies anonymous writes", async () => {
    await expect(
      asUser(null, () =>
        db.query(
          "insert into public.posts(author_id,title,body,topic,kind) values($1,'Bad insert','Test body long enough','CEC','discussion')",
          [alice],
        ),
      ),
    ).rejects.toThrow();
  });
  it("denies forged author on insert", async () => {
    await expect(
      asUser(bob, () =>
        db.query(
          "insert into public.posts(author_id,title,body,topic,kind) values($1,'Bad insert','Test body long enough','CEC','discussion')",
          [alice],
        ),
      ),
    ).rejects.toThrow();
  });
  it("another user cannot edit or delete the author’s post", async () => {
    expect(
      (
        await asUser(bob, () =>
          db.query(
            "update public.posts set title='Hacked title' where id=$1 returning id",
            [postId],
          ),
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(bob, () =>
          db.query("delete from public.posts where id=$1 returning id", [
            postId,
          ]),
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("author can edit own post", async () => {
    expect(
      (
        await asUser(alice, () =>
          db.query(
            "update public.posts set title='Updated title' where id=$1 returning id",
            [postId],
          ),
        )
      ).rows,
    ).toHaveLength(1);
  });
  it("cannot modify author, moderation flag or roles", async () => {
    await expect(
      asUser(alice, () =>
        db.query("update public.posts set author_id=$1 where id=$2", [
          bob,
          postId,
        ]),
      ),
    ).rejects.toThrow();
    await expect(
      asUser(alice, () =>
        db.query("update public.posts set hidden=true where id=$1", [postId]),
      ),
    ).rejects.toThrow();
    await expect(
      asUser(alice, () =>
        db.query("insert into public.admin_roles values($1)", [alice]),
      ),
    ).rejects.toThrow();
  });
  it("profile update is restricted to owner", async () => {
    expect(
      (
        await asUser(bob, () =>
          db.query(
            "update public.profiles set display_name='Other name' where id=$1 returning id",
            [alice],
          ),
        )
      ).rows,
    ).toHaveLength(0);
  });
  it("non-admin cannot call moderation RPC", async () => {
    await expect(
      asUser(alice, () =>
        db.query("select public.moderate_content('posts',$1,true)", [postId]),
      ),
    ).rejects.toThrow("Forbidden");
  });
  it("admin hides content, author cannot unhide it", async () => {
    await db.query("insert into public.admin_roles values($1)", [bob]);
    await asUser(bob, () =>
      db.query("select public.moderate_content('posts',$1,true)", [postId]),
    );
    expect(
      (
        await asUser(null, () =>
          db.query("select * from public.posts where id=$1", [postId]),
        )
      ).rows,
    ).toHaveLength(0);
    expect(
      (
        await asUser(alice, () =>
          db.query(
            "update public.posts set title='Hidden edit' where id=$1 returning id",
            [postId],
          ),
        )
      ).rows,
    ).toHaveLength(0);
    await asUser(bob, () =>
      db.query("select public.moderate_content('posts',$1,false)", [postId]),
    );
  });
  it("replies inherit post visibility and protect authors", async () => {
    const reply = await asUser(alice, () =>
      db.query<{ id: string }>(
        "insert into public.comments(author_id,post_id,body) values($1,$2,'Reply text') returning id",
        [alice, postId],
      ),
    );
    const id = reply.rows[0].id;
    expect(
      (
        await asUser(bob, () =>
          db.query(
            "update public.comments set body='Changed' where id=$1 returning id",
            [id],
          ),
        )
      ).rows,
    ).toHaveLength(0);
    await asUser(bob, () =>
      db.query("select public.moderate_content('posts',$1,true)", [postId]),
    );
    expect(
      (
        await asUser(null, () =>
          db.query("select * from public.comments where id=$1", [id]),
        )
      ).rows,
    ).toHaveLength(0);
    await expect(
      asUser(alice, () =>
        db.query(
          "insert into public.comments(author_id,post_id,body) values($1,$2,'Hidden reply')",
          [alice, postId],
        ),
      ),
    ).rejects.toThrow();
    await asUser(bob, () =>
      db.query("select public.moderate_content('posts',$1,false)", [postId]),
    );
  });
  it("sync RPC cannot be called by public users", async () => {
    await expect(
      asUser(alice, () => db.query("select public.import_draws('[]'::jsonb)")),
    ).rejects.toThrow();
  });
  it("atomic import upserts and rolls back invalid batches", async () => {
    const good = {
      draw_number: "91b",
      date: "2018-05-30",
      round_type: "CEC",
      invitations: 500,
      crs: 440,
      tie_breaking: null,
      source_url: "https://www.canada.ca/",
    };
    await db.query("select public.import_draws($1::jsonb)", [
      JSON.stringify([good]),
    ]);
    await db.query("select public.import_draws($1::jsonb)", [
      JSON.stringify([good]),
    ]);
    expect((await db.query("select * from public.draws")).rows).toHaveLength(1);
    await expect(
      db.query("select public.import_draws($1::jsonb)", [
        JSON.stringify([
          { ...good, crs: 500 },
          { ...good, draw_number: "92", crs: 9999 },
        ]),
      ]),
    ).rejects.toThrow();
    expect(
      (
        await db.query<{ crs: number }>(
          "select crs from public.draws where draw_number='91b'",
        )
      ).rows[0].crs,
    ).toBe(440);
    expect(
      (await db.query("select * from public.sync_runs where status='success'"))
        .rows,
    ).toHaveLength(2);
  });
});
