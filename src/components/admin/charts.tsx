"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import type { TrendPoint } from "@/types/admin";

/**
 * Recharts wrappers themed with app tokens. Each accepts a `TrendPoint[]` and
 * renders inside a titled card. Values are formatted by an injectable
 * `valueFormat` so callers control units (bytes, ms, count).
 */

const AXIS = "hsl(215 16% 47%)";
const GRID = "hsl(214 32% 91% / 0.5)";

function shortDate(d: string): string {
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function ChartCard({
  title,
  subtitle,
  children,
  loading,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {loading ? <Skeleton className="h-[220px] w-full" /> : <div className="h-[220px] w-full">{children}</div>}
    </div>
  );
}

function ChartTooltip({ valueFormat }: { valueFormat?: (v: number) => string }) {
  return (
    <Tooltip
      contentStyle={{
        background: "hsl(var(--tooltip-bg, 222 47% 10%))",
        border: "1px solid hsl(217 33% 25%)",
        borderRadius: 8,
        fontSize: 12,
        color: "#fff",
      }}
      labelStyle={{ color: "#cbd5e1" }}
      formatter={(v: number | string) => (valueFormat ? valueFormat(Number(v)) : v)}
    />
  );
}

export function TrendAreaChart({
  data,
  color = "#7c3aed",
  valueFormat,
}: {
  data: TrendPoint[];
  color?: string;
  valueFormat?: (v: number) => string;
}) {
  const id = React.useId();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => (valueFormat ? valueFormat(Number(v)) : String(v))} />
        <ChartTooltip valueFormat={valueFormat} />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${id})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({ data, color = "#2563eb", valueFormat }: { data: TrendPoint[]; color?: string; valueFormat?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => (valueFormat ? valueFormat(Number(v)) : String(v))} />
        <ChartTooltip valueFormat={valueFormat} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendBarChart({ data, color = "#0ea5e9", valueFormat }: { data: TrendPoint[]; color?: string; valueFormat?: (v: number) => string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} width={40} tickFormatter={(v) => (valueFormat ? valueFormat(Number(v)) : String(v))} />
        <ChartTooltip valueFormat={valueFormat} />
        <Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PIE_COLORS = ["#7c3aed", "#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

export function DonutChart({ data }: { data: Array<{ name: string; value: number }> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
