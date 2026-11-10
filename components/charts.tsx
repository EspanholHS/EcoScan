"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { statistics, temporalData } from "@/lib/domain";

export function CategoryChart({
  data,
}: {
  data: ReturnType<typeof statistics>["categories"];
}) {
  return (
    <div
      className="category-chart"
      role="img"
      aria-label={data.map((d) => `${d.label}: ${d.count}`).join(". ")}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 0, right: 22, top: 8, bottom: 0 }}
          barSize={10}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={128}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#b8c5ad", fontSize: 11, fontFamily: "Figtree" }}
          />
          <Tooltip
            labelStyle={{ color: "#edf3e5" }}
            itemStyle={{ color: "#c3dda1" }}
            cursor={{ fill: "#b4ce8d0c" }}
            contentStyle={{
              borderRadius: 8,
              backgroundColor: "#172219",
              color: "#edf3e5",
              border: "1px solid #506149",
              fontSize: 12,
            }}
            formatter={(value) => [`${value} análise(s)`, "Quantidade"]}
          />
          <Bar
            dataKey="count"
            radius={[0, 3, 3, 0]}
            background={{ fill: "#253226", radius: 3 }}
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimelineChart({
  data,
}: {
  data: ReturnType<typeof temporalData>["points"];
}) {
  return (
    <div
      className="timeline-chart"
      role="img"
      aria-label={data.map((d) => `${d.label}: ${d.count}`).join(". ")}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart
          data={data}
          margin={{ top: 18, right: 12, bottom: 4, left: -24 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id="timeline-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#bbd998" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#bbd998" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#344332"
            strokeDasharray="3 5"
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={14}
            tick={{ fill: "#a9b89e", fontSize: 10 }}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a9b89e", fontSize: 10 }}
          />
          <Tooltip
            labelStyle={{ color: "#edf3e5" }}
            itemStyle={{ color: "#c3dda1" }}
            contentStyle={{
              borderRadius: 8,
              backgroundColor: "#172219",
              color: "#edf3e5",
              border: "1px solid #506149",
              fontSize: 12,
            }}
            formatter={(value) => [`${value} análise(s)`, "Identificações"]}
          />
          <Area
            type="linear"
            dataKey="count"
            stroke="#c3dda1"
            strokeWidth={2}
            fill="url(#timeline-fill)"
            dot={{
              r: data.length > 30 ? 0 : 3,
              fill: "#c3dda1",
              stroke: "#172219",
              strokeWidth: 2,
            }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
