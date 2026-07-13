import "server-only";
import { prisma } from "@/lib/prisma";
import type { TrendPoint } from "@/types/admin";

/**
 * Time-series helpers for admin analytics. Daily aggregation is pushed down to
 * MySQL via `GROUP BY DATE(col)` so it scales to millions of rows without
 * pulling data into the app. Table/column names here are compile-time
 * constants (never user input), so `$queryRawUnsafe` is safe.
 */

export function startOfDaysAgo(days: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

/** Build an ordered list of ISO day strings from `days` ago to today. */
export function dayKeys(days: number): string[] {
  const keys: string[] = [];
  const start = startOfDaysAgo(days - 1);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

interface RawDayRow {
  day: string | Date;
  value: number | bigint | null;
}

function normalizeDay(day: string | Date): string {
  if (day instanceof Date) return day.toISOString().slice(0, 10);
  return String(day).slice(0, 10);
}

/** Fill a sparse `day -> value` map into a dense, ordered TrendPoint series. */
function densify(rows: RawDayRow[], days: number, opts?: { cumulative?: boolean }): TrendPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(normalizeDay(r.day), Number(r.value ?? 0));
  }
  const keys = dayKeys(days);
  let running = 0;
  return keys.map((date) => {
    const v = map.get(date) ?? 0;
    running += v;
    return { date, value: opts?.cumulative ? running : v };
  });
}

/**
 * Daily aggregate over a table's date column. `agg` is a raw SQL expression
 * such as `COUNT(*)` or `SUM(tokensUsed)`. `where` is an optional extra
 * predicate (constant, no user input).
 */
export async function dailySeries(opts: {
  table: string;
  dateColumn: string;
  agg: string;
  days: number;
  where?: string;
  cumulative?: boolean;
}): Promise<TrendPoint[]> {
  const since = startOfDaysAgo(opts.days - 1);
  const sinceIso = since.toISOString().slice(0, 19).replace("T", " ");
  const whereClause = opts.where ? `AND ${opts.where}` : "";
  const sql = `
    SELECT DATE(${opts.dateColumn}) AS day, ${opts.agg} AS value
    FROM ${opts.table}
    WHERE ${opts.dateColumn} >= '${sinceIso}' ${whereClause}
    GROUP BY DATE(${opts.dateColumn})
    ORDER BY day ASC
  `;
  const rows = await prisma.$queryRawUnsafe<RawDayRow[]>(sql);
  return densify(rows, opts.days, { cumulative: opts.cumulative });
}
