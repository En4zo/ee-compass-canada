"use client";
import { useI18n } from "@/components/providers";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
export function SetupNotice() {
  const { t } = useI18n();
  return (
    <section className="panel empty-state">
      <MessageSquare size={32} />
      <h2>
        {t("连接社区，只差一步", "Your community is one connection away")}
      </h2>
      <p>
        {t(
          "当前为预览模式。配置 Supabase 数据库与认证后，即可注册、发帖和回复。接入步骤见项目 README。",
          "This is preview mode. Configure Supabase database and authentication to sign up, post and reply. Follow the project README.",
        )}
      </p>
      <Link href="/forum" className="button secondary">
        {t("浏览示例讨论", "Browse sample discussions")}
      </Link>
    </section>
  );
}
export function SignInNotice() {
  const { t } = useI18n();
  return (
    <div className="info-box">
      {t("登录后即可参与讨论。", "Sign in to join the discussion.")}{" "}
      <Link className="text-link" href="/account">
        {t("登录 / 注册", "Sign in / Register")} →
      </Link>
    </div>
  );
}
