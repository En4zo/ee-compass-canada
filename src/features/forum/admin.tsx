"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/providers";
import { PageHeading } from "@/components/ui";
type Content = {
  id: string;
  body: string;
  title?: string;
  hidden: boolean;
  created_at: string;
};
type Run = {
  id: number;
  created_at: string;
  status: string;
  record_count: number;
  message: string | null;
};
export function Admin({
  posts,
  comments,
  runs,
}: {
  posts: Content[];
  comments: Content[];
  runs: Run[];
}) {
  const { t } = useI18n(),
    router = useRouter();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function moderate(type: string, item: Content) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: type,
          content_id: item.id,
          hide: !item.hidden,
        }),
      });
      if (!r.ok) throw new Error();
      router.refresh();
    } catch {
      setError(t("审核操作失败。", "Moderation action failed."));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title={["管理中心", "Administration"]}
        description={[
          "审核社区内容，检查官方数据同步情况。",
          "Moderate community content and review official data synchronization.",
        ]}
      />
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {[
        ["posts", posts],
        ["comments", comments],
      ].map(([type, items]) => (
        <section className="panel admin-section" key={String(type)}>
          <h2>
            {type === "posts"
              ? t("最近帖子", "Recent posts")
              : t("最近回复", "Recent replies")}
          </h2>
          {(items as Content[]).map((item) => (
            <div className="admin-row" key={item.id}>
              <div>
                <strong>{item.title || item.body.slice(0, 120)}</strong>
                <p>
                  {item.created_at.slice(0, 10)} ·{" "}
                  {item.hidden ? t("已隐藏", "Hidden") : t("公开", "Public")}
                </p>
              </div>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => moderate(String(type), item)}
              >
                {item.hidden ? t("恢复", "Restore") : t("隐藏", "Hide")}
              </button>
            </div>
          ))}
          {!(items as Content[]).length && (
            <p className="muted">{t("暂无内容", "No content")}</p>
          )}
        </section>
      ))}
      <section className="panel admin-section">
        <h2>{t("最近同步记录", "Recent sync runs")}</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{t("时间", "Time")}</th>
                <th>{t("状态", "Status")}</th>
                <th>{t("记录数", "Records")}</th>
                <th>{t("信息", "Message")}</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td>{r.created_at}</td>
                  <td>{r.status}</td>
                  <td>{r.record_count}</td>
                  <td>{r.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!runs.length && (
          <p className="muted">{t("尚未执行同步。", "No sync has run yet.")}</p>
        )}
      </section>
    </>
  );
}
