"use client";
import { useI18n } from "@/components/providers";
import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowUpRight, MessageSquare } from "lucide-react";
import { PageHeading } from "@/components/ui";
import type { Post } from "./schema";
import { Kind } from "./content-badge";
import { topics } from "./schema";
export function ForumList({ posts }: { posts: Post[] }) {
  const { t } = useI18n();
  const [topic, setTopic] = useState("all");
  const filtered = posts.filter((p) => topic === "all" || p.topic === topic);
  return (
    <>
      <PageHeading
        eyebrow="A COMMUNITY, NOT AN ECHO CHAMBER"
        title={["这一路，不必独行。", "You don’t have to figure it out alone."]}
        description={[
          "分享经历，认真提问。让事实有来源，让经验有边界。",
          "Share experiences and ask questions. Keep facts sourced and experiences in perspective.",
        ]}
        action={
          <Link href="/forum/new" className="button">
            <Plus size={17} />
            {t("发起讨论", "Start a discussion")}
          </Link>
        }
      />
      <div className="forum-layout">
        <section>
          <div className="topic-tabs">
            {["all", ...topics].map((v) => (
              <button
                className={v === topic ? "selected" : ""}
                key={v}
                onClick={() => setTopic(v)}
              >
                {v === "all"
                  ? t("全部讨论", "All topics")
                  : v === "General"
                    ? t("综合讨论", "General")
                    : v === "French"
                      ? t("法语", "French")
                      : v}
              </button>
            ))}
          </div>
          <div className="panel post-list">
            {filtered.map((p) => (
              <Link className="post-row" href={`/forum/${p.id}`} key={p.id}>
                <div className="post-avatar">
                  {p.profiles?.display_name.slice(0, 1) || "E"}
                </div>
                <div>
                  <div className="post-tags">
                    <Kind kind={p.kind} />
                    <span className="topic-label">{p.topic}</span>
                    {p.id.startsWith("demo") && (
                      <span className="muted">{t("示例", "Sample")}</span>
                    )}
                  </div>
                  <h2>{p.title}</h2>
                  <p className="post-excerpt">{p.body}</p>
                  <div className="post-meta">
                    {p.profiles?.display_name} · {p.created_at.slice(0, 10)}
                  </div>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))}
            {!filtered.length && (
              <div className="empty-state">
                {t(
                  "这个主题还没有讨论，欢迎发起第一帖。",
                  "No discussions in this topic yet. Start the first one.",
                )}
              </div>
            )}
          </div>
          <p className="muted list-note">
            {t(
              "按时间排序，显示最近 100 条讨论。",
              "Sorted by time, showing the latest 100 discussions.",
            )}
          </p>
        </section>
        <aside className="panel forum-guide">
          <MessageSquare size={25} />
          <h2>
            {t("好的讨论，从这里开始", "Make room for a good conversation")}
          </h2>
          <p>
            {t(
              "不要分享 UCI、护照、工签或其他敏感个人资料。",
              "Keep UCI numbers, passports, permits and sensitive information private.",
            )}
          </p>
          <div className="divider" />
          <Kind kind="official" />
          <p>
            {t(
              "引用官方信息时附上 canada.ca 链接。标签表示来源类型，不代表政府认证。",
              "Include a canada.ca link when citing official information. The label is not government endorsement.",
            )}
          </p>
          <Kind kind="experience" />
          <p>
            {t(
              "个人经历提供参考，但不保证适用于其他申请人。",
              "Personal experiences offer context, not guarantees for other applicants.",
            )}
          </p>
          <Kind kind="discussion" />
          <p>
            {t(
              "欢迎问题与不同观点，请尊重彼此。",
              "Questions and different perspectives are welcome. Be respectful.",
            )}
          </p>
        </aside>
      </div>
    </>
  );
}
