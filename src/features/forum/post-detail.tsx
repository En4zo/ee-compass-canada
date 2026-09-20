"use client";
import { useI18n } from "@/components/providers";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { hasBackend } from "@/lib/env";
import type { Post, Comment } from "./schema";
import { Kind } from "./content-badge";
import { SignInNotice } from "./notices";
export function PostDetail({
  post,
  comments,
}: {
  post: Post;
  comments: Comment[];
}) {
  const { t, user } = useI18n(),
    router = useRouter();
  const [reply, setReply] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const demo = !hasBackend();
  async function remove() {
    if (
      !confirm(
        t(
          "确定删除这篇讨论及其回复？",
          "Delete this discussion and its replies?",
        ),
      )
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      router.push("/forum");
      router.refresh();
    } catch {
      setError(t("删除失败，请重试。", "Could not delete. Please retry."));
    } finally {
      setBusy(false);
    }
  }
  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      if (!r.ok) throw new Error();
      setReply("");
      router.refresh();
    } catch {
      setError(
        t(
          "回复失败，请检查登录状态或稍后重试。",
          "Could not reply. Check your session or try again later.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="article-container">
      <Link href="/forum" className="text-link back-link">
        <ArrowLeft size={16} />
        {t("返回社区", "Back to community")}
      </Link>
      <article className="panel article">
        <div className="post-tags">
          <Kind kind={post.kind} />
          <span className="topic-label">{post.topic}</span>
          {demo && (
            <span className="muted">{t("示例内容", "Sample content")}</span>
          )}
        </div>
        <h1>{post.title}</h1>
        <div className="post-meta">
          {post.profiles?.display_name} · {post.created_at.slice(0, 10)}
        </div>
        {post.hidden && (
          <div className="info-box">
            {t(
              "此内容已被管理员隐藏。",
              "This content has been hidden by an administrator.",
            )}
          </div>
        )}
        <div className="article-body">{post.body}</div>
        {post.source_url && (
          <a
            className="source-link"
            href={post.source_url}
            target="_blank"
            rel="noreferrer"
          >
            {t("查看引用来源", "Read the cited source")}
            <ArrowUpRight size={16} />
          </a>
        )}
        {user?.id === post.author_id && (
          <div className="inline-actions">
            {!post.hidden && (
              <Link
                className="button secondary"
                href={`/forum/${post.id}/edit`}
              >
                {t("编辑", "Edit")}
              </Link>
            )}
            <button className="button danger" disabled={busy} onClick={remove}>
              {t("删除讨论", "Delete discussion")}
            </button>
          </div>
        )}
      </article>
      <section className="panel replies">
        <h2>
          {t("回复", "Replies")}{" "}
          <span className="muted">{comments.length}</span>
        </h2>
        {comments.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
        {!comments.length && (
          <p className="muted">
            {t(
              "还没有回复。分享你的理解吧。",
              "No replies yet. Share your perspective.",
            )}
          </p>
        )}
        {demo ? (
          <div className="info-box">
            {t(
              "示例讨论仅供浏览，接入 Supabase 后可参与社区。",
              "Sample discussions are read-only. Connect Supabase to participate.",
            )}
          </div>
        ) : user && !post.hidden ? (
          <form onSubmit={send} className="form-stack">
            <label className="field">
              <span>{t("你的回复", "Your reply")}</span>
              <textarea
                required
                maxLength={5000}
                rows={4}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </label>
            <button className="button" disabled={busy || !reply.trim()}>
              {t("发布回复", "Post reply")}
            </button>
          </form>
        ) : !user ? (
          <SignInNotice />
        ) : null}
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
function CommentItem({ comment: c }: { comment: Comment }) {
  const { t, user } = useI18n(),
    router = useRouter();
  const [editing, setEditing] = useState(false),
    [value, setValue] = useState(c.body),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function act(method: "PATCH" | "DELETE") {
    if (
      method === "DELETE" &&
      !confirm(t("确定删除回复？", "Delete this reply?"))
    )
      return;
    setBusy(true);
    try {
      const r = await fetch(`/api/comments/${c.id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "PATCH"
          ? { body: JSON.stringify({ body: value }) }
          : {}),
      });
      if (!r.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      setError(t("操作失败，请稍后重试。", "Could not complete this action."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="comment">
      <div className="post-meta">
        {c.profiles?.display_name} · {c.created_at.slice(0, 10)}
        {c.hidden && ` · ${t("已隐藏", "Hidden")}`}
      </div>
      {editing ? (
        <label className="field">
          <span>{t("编辑回复", "Edit reply")}</span>
          <textarea
            maxLength={5000}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
      ) : (
        <p className="article-body">{c.body}</p>
      )}
      {user?.id === c.author_id && (
        <div className="inline-actions">
          {editing ? (
            <>
              <button
                className="text-link"
                disabled={busy || !value.trim()}
                onClick={() => act("PATCH")}
              >
                {t("保存", "Save")}
              </button>
              <button className="text-link" onClick={() => setEditing(false)}>
                {t("取消", "Cancel")}
              </button>
            </>
          ) : (
            !c.hidden && (
              <button className="text-link" onClick={() => setEditing(true)}>
                {t("编辑", "Edit")}
              </button>
            )
          )}
          <button
            className="text-link"
            disabled={busy}
            onClick={() => act("DELETE")}
          >
            {t("删除", "Delete")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}
