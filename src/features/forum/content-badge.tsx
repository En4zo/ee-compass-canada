"use client";
import { useI18n } from "@/components/providers";
export function Kind({ kind }: { kind: string }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${kind}`}>
      {kind === "official"
        ? t("官方来源引用", "Official reference")
        : kind === "experience"
          ? t("个人经历", "Personal experience")
          : t("一般讨论", "Discussion")}
    </span>
  );
}
