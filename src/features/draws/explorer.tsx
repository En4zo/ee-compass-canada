"use client";
import { useState } from "react";
import { useBrowserValue } from "@/lib/browser-storage";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { useI18n } from "@/components/providers";
import { DrawChart } from "./chart";
import { shortRound, type Draw } from "./adapter";
export function DrawExplorer({
  draws,
  compact = false,
}: {
  draws: Draw[];
  compact?: boolean;
}) {
  const { t } = useI18n();
  const [type, setType] = useState("Canadian Experience Class"),
    [period, setPeriod] = useState("365"),
    [start, setStart] = useState(""),
    [end, setEnd] = useState("");
  const [page, setPage] = useState(0);
  const [savedScore, setSavedScore] = useBrowserValue(
    "compass-crs",
    "sessionStorage",
  );
  const score =
    savedScore !== null &&
    Number.isFinite(Number(savedScore)) &&
    Number(savedScore) >= 0 &&
    Number(savedScore) <= 1200
      ? Number(savedScore)
      : null;
  const types = Array.from(new Set(draws.map((d) => d.round_type)));
  const anchor = draws[0]?.date ?? new Date().toISOString().slice(0, 10);
  const cutoff =
    period === "all"
      ? ""
      : new Date(
          new Date(anchor + "T00:00:00Z").getTime() - Number(period) * 86400000,
        )
          .toISOString()
          .slice(0, 10);
  const filtered = draws.filter(
    (d) =>
      d.round_type === type &&
      d.date >= cutoff &&
      (!start || d.date >= start) &&
      (!end || d.date <= end),
  );
  const pageSize = compact ? 5 : 12,
    shown = filtered.slice(page * pageSize, page * pageSize + pageSize);
  return (
    <section className="panel trend-panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DRAW INSIGHTS</span>
          <h2>{t("看清同类抽选的变化", "See the trend in context")}</h2>
        </div>
        {compact && (
          <Link className="text-link" href="/draws">
            {t("全部历史", "Full history")}
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <div className="filters">
        <label>
          <span className="sr-only">{t("抽选类别", "Round type")}</span>
          <select
            aria-label={t("抽选类别", "Round type")}
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(0);
            }}
          >
            {types.map((v) => (
              <option key={v} value={v}>
                {shortRound(v)}
              </option>
            ))}
          </select>
        </label>
        <div className="segmented">
          {[
            ["90", "3M"],
            ["180", "6M"],
            ["365", "1Y"],
            ["all", t("全部", "All")],
          ].map(([value, label]) => (
            <button
              key={value}
              className={period === value ? "selected" : ""}
              onClick={() => {
                setPeriod(value);
                setPage(0);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {!compact && (
          <div className="date-filters">
            <label>
              {t("从", "From")}
              <input
                type="date"
                value={start}
                onInput={(e) => {
                  setStart(e.currentTarget.value);
                  setPage(0);
                }}
              />
            </label>
            <label>
              {t("至", "To")}
              <input
                type="date"
                min={start}
                value={end}
                onInput={(e) => {
                  setEnd(e.currentTarget.value);
                  setPage(0);
                }}
              />
            </label>
          </div>
        )}
      </div>
      <div className="chart-legend">
        <span>
          <i />
          {t("最低 CRS 分数", "CRS cut-off")}
        </span>
        <span>
          {filtered.length}{" "}
          {t(
            "次抽选 · 范围以最新记录为基准",
            "rounds · range ends at latest record",
          )}
        </span>
      </div>
      <DrawChart draws={filtered} score={score} />
      <div className="chart-note">
        <SlidersHorizontal size={15} />
        {score === null
          ? t(
              "完成 CRS 自评，将你的分数加入图表进行比较。",
              "Calculate your CRS to add your score to this chart.",
            )
          : `${t("你的参考分数", "Your reference score")}: ${score}`}
        {score !== null && (
          <button
            className="text-link"
            onClick={() => {
              setSavedScore(null);
            }}
          >
            {t("移除", "Remove")}
          </button>
        )}
      </div>
      <div className="table-scroll">
        <table>
          <caption className="sr-only">
            {t("抽选历史明细", "Draw history details")}
          </caption>
          <thead>
            <tr>
              <th>{t("轮次 / 日期", "Round / date")}</th>
              <th>{t("类别", "Round type")}</th>
              <th>{t("邀请人数", "Invitations")}</th>
              <th>{t("最低分", "Cut-off")}</th>
              {!compact && <th>Tie-breaking rule</th>}
              <th>
                <span className="sr-only">{t("来源", "Source")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.draw_number}>
                <td>
                  <strong>#{d.draw_number}</strong>
                  <small>{d.date}</small>
                </td>
                <td>
                  <span className="round-tag">{shortRound(d.round_type)}</span>
                </td>
                <td>{d.invitations.toLocaleString()}</td>
                <td>
                  <strong className="score-text">{d.crs}</strong>
                </td>
                {!compact && (
                  <td className="tie-break">
                    {d.tie_breaking || t("官方未提供", "Not provided")}
                  </td>
                )}
                <td>
                  <a
                    className="icon-button"
                    href={d.source_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t("查看官方轮次", "View official round")} ${d.draw_number}`}
                  >
                    <ArrowUpRight size={17} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!filtered.length && (
        <div className="empty-state">
          {t("没有匹配的抽选记录", "No matching draws")}
        </div>
      )}
      {!compact && (
        <div className="pagination">
          <span>
            {filtered.length} {t("条记录", "records")} · {page + 1} /{" "}
            {Math.max(1, Math.ceil(filtered.length / pageSize))}
          </span>
          <button
            className="icon-button"
            aria-label={t("上一页", "Previous page")}
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="icon-button"
            aria-label={t("下一页", "Next page")}
            disabled={(page + 1) * pageSize >= filtered.length}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  );
}
