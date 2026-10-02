"use client";
import { useI18n } from "@/components/providers";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="panel empty-state">
      <h1>{t("暂时无法加载内容", "Content is temporarily unavailable")}</h1>
      <p>
        {t(
          "请检查网络或数据库连接后重试。已配置的服务不会自动切换为示例数据。",
          "Check the connection and try again. Configured services will not fall back to sample data.",
        )}
      </p>
      <button className="button" onClick={reset}>
        {t("重试", "Try again")}
      </button>
    </div>
  );
}
