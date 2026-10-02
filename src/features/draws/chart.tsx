"use client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { Draw } from "./adapter";
import { useI18n } from "@/components/providers";
export function DrawChart({
  draws,
  score,
}: {
  draws: Draw[];
  score: number | null;
}) {
  const { t } = useI18n();
  if (!draws.length)
    return (
      <div className="empty-state">
        {t(
          "此范围内暂无抽选，请调整筛选条件。",
          "No draws in this range. Try a different filter.",
        )}
      </div>
    );
  const data = [...draws].reverse();
  return (
    <div
      className="chart"
      role="img"
      aria-label={t(
        "所选类别的历史最低 CRS 分数趋势，下方表格提供明细。",
        "Historical CRS cut-off trend for the selected category. Details are in the table below.",
      )}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 24, right: 22, left: -20, bottom: 4 }}
        >
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#12988d" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#12988d" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e8eeef"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(s) => String(s).slice(5)}
            minTickGap={32}
            tick={{ fontSize: 12, fill: "#687b82" }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            domain={[
              (min: number) =>
                Math.max(
                  0,
                  Math.floor(Math.min(min, score ?? min) / 25) * 25 - 25,
                ),
              (max: number) =>
                Math.min(
                  1200,
                  Math.ceil(Math.max(max, score ?? max) / 25) * 25 + 25,
                ),
            ]}
            tick={{ fontSize: 12, fill: "#687b82" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as Draw;
              return (
                <div className="chart-tooltip">
                  <strong>
                    #{d.draw_number} · {d.date}
                  </strong>
                  <p>
                    CRS <b>{d.crs}</b>
                  </p>
                  <p>
                    {t("邀请人数", "Invitations")}{" "}
                    {d.invitations.toLocaleString()}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="linear"
            dataKey="crs"
            stroke="#11877e"
            fill="url(#chart-fill)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
          {score !== null && (
            <ReferenceLine
              y={score}
              stroke="#df9451"
              strokeDasharray="6 5"
              label={{
                value: `${t("我的 CRS", "My CRS")} ${score}`,
                position: "insideTopRight",
                fill: "#a76730",
                fontSize: 12,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
