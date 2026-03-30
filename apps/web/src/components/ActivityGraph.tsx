import { useMemo } from "react";

import type { DailyReviewCount } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";

interface ActivityGraphProps {
  data: DailyReviewCount[];
}

const WEEKS = 53;

// Fixed dimensions for the grid
const CELL_SIZE = 14; // 14px
const GAP = 4; // 4px
const DAY_LABEL_WIDTH = 28; // 28px

function getMonthLabels(
  startDate: Date,
  monthNames: readonly string[],
): { label: string; col: number }[] {
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < WEEKS; week++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + week * 7);
    const month = d.getMonth();
    if (month !== lastMonth) {
      months.push({ label: monthNames[month]!, col: week });
      lastMonth = month;
    }
  }

  return months;
}

function getIntensityClass(count: number, maxCount: number): string {
  if (count === 0) return "bg-white/5";
  const ratio = count / maxCount;
  if (ratio <= 0.25) return "bg-accent-primary/25";
  if (ratio <= 0.5) return "bg-accent-primary/50";
  if (ratio <= 0.75) return "bg-accent-primary/75";
  return "bg-accent-primary";
}

export default function ActivityGraph({ data }: ActivityGraphProps) {
  const { t, tArray } = useLocale();

  const monthNames = tArray("activity.months");
  const dayLabels = tArray("activity.days");

  const { grid, startDate, maxCount, totalReviews } = useMemo(() => {
    const countMap = new Map<string, number>();
    let max = 0;
    let total = 0;

    for (const entry of data) {
      countMap.set(entry.date, entry.count);
      if (entry.count > max) max = entry.count;
      total += entry.count;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const cells: (number | null)[][] = [];
    for (let week = 0; week < WEEKS; week++) {
      const column: (number | null)[] = [];
      for (let day = 0; day < 7; day++) {
        const d = new Date(start);
        d.setDate(d.getDate() + week * 7 + day);
        if (d > today) {
          column.push(null);
        } else {
          const dateStr = formatDate(d);
          column.push(countMap.get(dateStr) ?? 0);
        }
      }
      cells.push(column);
    }

    return {
      grid: cells,
      startDate: start,
      maxCount: max || 1,
      totalReviews: total,
    };
  }, [data]);

  const monthLabels = useMemo(
    () => getMonthLabels(startDate, monthNames),
    [startDate, monthNames],
  );

  return (
    <div className="flex flex-col gap-2 w-full overflow-x-auto pb-4 overflow-y-hidden">
      <div className="min-w-max mx-auto">
        {/* Month labels */}
        <div
          className="relative h-4"
          style={{ marginLeft: DAY_LABEL_WIDTH + 6 }}
        >
          {monthLabels.map(({ label, col }) => (
            <span
              key={`${label}-${col}`}
              className="absolute font-display text-[0.6875rem] font-medium text-text-secondary tracking-[0.02em]"
              style={{ left: col * (CELL_SIZE + GAP) }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-[6px]">
          {/* Day labels */}
          <div className="flex flex-col pr-[2px]" style={{ gap: GAP }}>
            {dayLabels.map((label, i) => (
              <span
                key={i}
                className="font-display text-[0.625rem] font-medium text-text-secondary text-right w-[24px]"
                style={{
                  height: CELL_SIZE,
                  lineHeight: `${CELL_SIZE}px`,
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid cells */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${WEEKS}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
              gap: GAP,
            }}
          >
            {grid.map((week, weekIdx) =>
              week.map((count, dayIdx) => {
                if (count === null) {
                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      style={{
                        gridColumn: weekIdx + 1,
                        gridRow: dayIdx + 1,
                      }}
                    />
                  );
                }

                const d = new Date(startDate);
                d.setDate(d.getDate() + weekIdx * 7 + dayIdx);
                const pad = (n: number) => n.toString().padStart(2, "0");
                const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

                return (
                  <div
                    key={`${weekIdx}-${dayIdx}`}
                    className={`rounded-[3px] transition-all duration-150 cursor-crosshair hover:outline-2 hover:outline-text-secondary hover:-outline-offset-1 hover:scale-125 hover:z-10 ${getIntensityClass(count, maxCount)}`}
                    style={{
                      gridColumn: weekIdx + 1,
                      gridRow: dayIdx + 1,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                    title={`${dateStr}: ${count} ${count !== 1 ? t("activity.reviews") : t("activity.review")}`}
                  />
                );
              }),
            )}
          </div>
        </div>

        {/* Footer legend */}
        <div className="flex items-center justify-between flex-wrap gap-3 mt-4 w-full">
          <span className="font-display text-[0.8125rem] font-semibold text-text-secondary">
            {totalReviews} {t("activity.reviewsInYear")}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-display text-[0.625rem] font-medium text-text-muted mx-[3px]">
              {t("activity.less")}
            </span>
            <div className="w-[12px] h-[12px] rounded-[3px] bg-white/5" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-accent-primary/25" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-accent-primary/50" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-accent-primary/75" />
            <div className="w-[12px] h-[12px] rounded-[3px] bg-accent-primary" />
            <span className="font-display text-[0.625rem] font-medium text-text-muted mx-[3px]">
              {t("activity.more")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
