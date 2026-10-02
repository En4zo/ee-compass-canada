"use client";
import { useI18n } from "./providers";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: [string, string];
  description: [string, string];
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{t(...title)}</h1>
        <p>{t(...description)}</p>
      </div>
      {action}
    </div>
  );
}
