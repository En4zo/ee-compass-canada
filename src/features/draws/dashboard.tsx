"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Users,
  TrendingUp,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { PageHeading } from "@/components/ui";
import { shortRound, type Draw } from "./adapter";
import { DrawExplorer } from "./explorer";
import type { Post } from "@/features/forum/schema";
export type DrawData = {
  draws: Draw[];
  demo: boolean;
  updatedAt: string | null;
  checkedAt: string | null;
  syncFailed: boolean;
};
export function DataStamp({ data }: { data: DrawData }) {
  const { t } = useI18n();
  return (
    <div className={`data-stamp ${data.syncFailed ? "warning" : ""}`}>
      <ShieldCheck size={15} />
      <span>
        {data.demo
          ? t("官方快照获取时间", "Official snapshot captured")
          : t("最近同步成功", "Last successful sync")}
        :{" "}
        {data.updatedAt
          ? data.updatedAt.slice(0, 16).replace("T", " ") + " UTC"
          : t("等待首次导入", "Awaiting first import")}
        {data.checkedAt &&
          ` · ${t("最近检查", "Last checked")}: ${data.checkedAt.slice(0, 16).replace("T", " ")} UTC`}
        {data.syncFailed &&
          ` · ${t("最近同步失败，正在展示已有记录", "Latest sync failed; showing existing records")}`}
      </span>
    </div>
  );
}
export function Dashboard({
  data,
  posts,
  forumUnavailable = false,
}: {
  data: DrawData;
  posts: Post[];
  forumUnavailable?: boolean;
}) {
  const { t } = useI18n();
  const latest = data.draws[0],
    cec = data.draws.filter(
      (d) => d.round_type === "Canadian Experience Class",
    );
  const delta = cec.length > 1 ? cec[0].crs - cec[1].crs : 0;
  return (
    <>
      <PageHeading
        eyebrow="YOUR JOURNEY, IN PERSPECTIVE"
        title={["每一步，都更清晰。", "A clearer view of your next step."]}
        description={[
          "读懂抽选数据，了解自己的分数，找到同行的伙伴。",
          "Understand the draws. Know your score. Find your community.",
        ]}
        action={
          <Link href="/calculator" className="button">
            {t("计算我的 CRS", "Calculate my CRS")}
            <ArrowUpRight size={17} />
          </Link>
        }
      />
      <DataStamp data={data} />
      <div className="stats-grid">
        <article className="stat-card featured">
          <div className="stat-label">
            <span>{t("最近一轮抽选", "Latest draw")}</span>
            <CalendarDays size={18} />
          </div>
          <div className="stat-value">
            {latest?.crs ?? "—"}
            <span>CRS</span>
          </div>
          <div className="stat-footer">
            <span>
              {latest
                ? shortRound(latest.round_type)
                : t("暂无数据", "No data")}
            </span>
            <small>{latest?.date}</small>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            <span>{t("本轮邀请人数", "Invitations issued")}</span>
            <Users size={18} />
          </div>
          <div className="stat-value">
            {latest?.invitations.toLocaleString() ?? "—"}
            <span>ITA</span>
          </div>
          <div className="stat-footer">
            <span>{t("来自 IRCC 官方公布", "Published by IRCC")}</span>
            <small>#{latest?.draw_number ?? "—"}</small>
          </div>
        </article>
        <article className="stat-card">
          <div className="stat-label">
            <span>{t("最近 CEC 最低分", "Latest CEC cut-off")}</span>
            <TrendingUp size={18} />
          </div>
          <div className="stat-value">
            {cec[0]?.crs ?? "—"}
            <span>CRS</span>
          </div>
          <div className="stat-footer">
            <span className="delta">
              {delta > 0 ? "+" : ""}
              {delta} {t("较上一轮 CEC", "vs. previous CEC")}
            </span>
            <small>{cec[0]?.date}</small>
          </div>
        </article>
      </div>
      <div className="dashboard-grid">
        <DrawExplorer draws={data.draws} compact />
        <aside className="right-rail">
          <section className="calculator-promo">
            <span className="eyebrow">KNOW WHERE YOU STAND</span>
            <h2>
              {t(
                "你的分数，\n不止一个数字。",
                "Your score.\nWith the full picture.",
              )}
            </h2>
            <p>
              {t(
                "一步步梳理背景，查看每一项分数从何而来。",
                "A guided assessment with a transparent breakdown of every point.",
              )}
            </p>
            <div className="score-illustration">
              <span>CRS</span>
              <strong>
                0 <span>—</span> 1,200
              </strong>
              <div className="score-scale">
                {Array.from({ length: 10 }, (_, i) => (
                  <i key={i} />
                ))}
              </div>
              <small>
                {t(
                  "核心因素 + 技能转移 + 附加分",
                  "Core factors + transferability + extras",
                )}
              </small>
            </div>
            <Link href="/calculator" className="button">
              {t("开始自评", "Start assessment")}
              <ArrowRight size={17} />
            </Link>
            <small className="privacy-line">
              {t(
                "无需注册 · 不保存个人背景",
                "No account needed · No profile stored",
              )}
            </small>
          </section>
          <section className="panel source-card">
            <BookOpen size={22} />
            <h3>
              {t(
                "可信信息，从来源开始",
                "Good information starts at the source",
              )}
            </h3>
            <p>
              {t(
                "抽选和评分链接回 IRCC。社区经验单独标记，方便你判断。",
                "Draws and scoring link back to IRCC. Community experiences are clearly labeled.",
              )}
            </p>
            <a
              href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry.html"
              target="_blank"
              rel="noreferrer"
              className="text-link"
            >
              {t("阅读官方指南", "Read the official guide")}
              <ArrowUpRight size={15} />
            </a>
          </section>
        </aside>
      </div>
      <section className="panel community-preview">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BETTER, TOGETHER</span>
            <h2>
              {t(
                "在社区，交换真实的理解",
                "A little perspective from the community",
              )}
            </h2>
          </div>
          <Link className="text-link" href="/forum">
            {t("进入社区", "Visit community")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="preview-posts">
          {posts.slice(0, 3).map((p) => (
            <Link className="preview-post" href={`/forum/${p.id}`} key={p.id}>
              <span className={`badge ${p.kind}`}>
                {p.topic} ·{" "}
                {p.kind === "official"
                  ? t("官方来源引用", "Official reference")
                  : p.kind === "experience"
                    ? t("个人经历", "Experience")
                    : t("一般讨论", "Discussion")}
              </span>
              <h3>{p.title}</h3>
              <span>
                {p.profiles?.display_name} · {p.created_at.slice(0, 10)}
              </span>
            </Link>
          ))}
          {!posts.length && (
            <p>
              {forumUnavailable
                ? t(
                    "社区暂时无法加载，请稍后重试。",
                    "Community is temporarily unavailable.",
                  )
                : t(
                    "还没有帖子，来发起第一个讨论吧。",
                    "No posts yet. Start the first conversation.",
                  )}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
