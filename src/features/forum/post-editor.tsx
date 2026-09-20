"use client";
import { useI18n } from "@/components/providers";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { hasBackend } from "@/lib/env";
import { postSchema, topics, type Post } from "./schema";
import { SetupNotice, SignInNotice } from "./notices";
export function PostEditor({ post }: { post?: Post }) {
  const { t, user, authLoading } = useI18n(),
    router = useRouter();
  const [title, setTitle] = useState(post?.title ?? ""),
    [body, setBody] = useState(post?.body ?? ""),
    [topic, setTopic] = useState(post?.topic ?? "CEC"),
    [kind, setKind] = useState(post?.kind ?? "discussion"),
    [source, setSource] = useState(post?.source_url ?? ""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!hasBackend()) return <SetupNotice />;
  if (authLoading)
    return (
      <p role="status">{t("正在检查登录状态…", "Checking your session…")}</p>
    );
  if (!user) return <SignInNotice />;
  if (post && post.author_id !== user.id)
    return (
      <p role="alert">
        {t("只有作者可以编辑此帖。", "Only the author can edit this post.")}
      </p>
    );
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = postSchema.safeParse({
      title,
      body,
      topic,
      kind,
      source_url: source,
    });
    if (!result.success) {
      setError(
        t(
          "请检查标题、正文和来源链接；官方来源引用需要 canada.ca HTTPS 链接。",
          "Check the title, body and source. Official references need a canada.ca HTTPS link.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(post ? `/api/posts/${post.id}` : "/api/posts", {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      router.push(`/forum/${data.id}`);
      router.refresh();
    } catch {
      setError(
        t(
          "提交失败。请确认登录、内容权限，并稍后重试。",
          "Could not submit. Check your session and permissions, then try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ADD YOUR PERSPECTIVE"
        title={
          post
            ? ["编辑讨论", "Edit discussion"]
            : ["发起讨论", "Start a discussion"]
        }
        description={[
          "清楚描述你的问题，并为政策相关信息附上来源。",
          "Describe your question clearly and cite sources for policy information.",
        ]}
      />
      <form className="panel editor form-stack" onSubmit={submit}>
        <label className="field">
          <span>{t("标题", "Title")}</span>
          <input
            required
            minLength={5}
            maxLength={160}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div className="form-two-columns">
          <label className="field">
            <span>{t("主题", "Topic")}</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              {topics.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{t("内容类型", "Content type")}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="discussion">{t("一般讨论", "Discussion")}</option>
              <option value="experience">
                {t("个人经历", "Personal experience")}
              </option>
              <option value="official">
                {t("官方来源引用", "Official reference")}
              </option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>{t("正文", "Body")}</span>
          <textarea
            required
            minLength={10}
            maxLength={10000}
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <small>
            {t(
              "纯文本发布，请勿填写敏感身份信息。",
              "Plain text only. Do not include sensitive identity details.",
            )}
          </small>
        </label>
        <label className="field">
          <span>
            {t("来源链接", "Source URL")}{" "}
            {kind !== "official" && t("（可选）", "(optional)")}
          </span>
          <input
            type="url"
            required={kind === "official"}
            placeholder="https://www.canada.ca/..."
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Link
            className="button secondary"
            href={post ? `/forum/${post.id}` : "/forum"}
          >
            {t("取消", "Cancel")}
          </Link>
          <button className="button" disabled={busy}>
            <Send size={16} />
            {busy
              ? t("正在保存…", "Saving…")
              : t("发布讨论", "Publish discussion")}
          </button>
        </div>
      </form>
    </>
  );
}
