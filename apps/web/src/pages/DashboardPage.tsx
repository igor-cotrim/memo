import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import type { ReviewStats, Deck } from "@flashcard-app/shared-types";
import * as api from "../services/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, decksData] = await Promise.all([
        api.getStats(),
        api.getDecks(),
      ]);
      setStats(statsData);
      setDecks(decksData);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayCount =
    stats?.last7Days.find(
      (d) => d.date === new Date().toISOString().split("T")[0],
    )?.count ?? 0;

  const weekTotal = stats?.last7Days.reduce((sum, d) => sum + d.count, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-10 animate-fade-slide-up page-header">
        <div>
          <h1 className="font-display text-[1.85rem] font-extrabold tracking-tight text-balance">
            Dashboard
          </h1>
          <p className="text-text-secondary text-[0.9375rem] mt-1">
            Your learning progress at a glance
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-1">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {stats?.currentStreak ?? 0}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            Day Streak 🔥
          </div>
        </div>
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-2">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {todayCount}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            Reviewed Today
          </div>
        </div>
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-3">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {weekTotal}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            This Week
          </div>
        </div>
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-4">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {decks.length}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            Total Decks
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md mb-4 stagger-5">
        <h2 className="font-display text-[1.125rem] font-bold tracking-tight mb-2">
          Last 30 Days
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 30 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            const dateStr = date.toISOString().split("T")[0];
            const count =
              stats?.last30Days.find((d) => d.date === dateStr)?.count ?? 0;
            const intensity = count === 0 ? 0 : Math.min(count / 10, 1);
            return (
              <div
                key={dateStr}
                className={`w-[14px] h-[14px] rounded-[3px] bg-bg-input ${count === 0 ? "opacity-40" : ""}`}
                title={`${dateStr}: ${count} reviews`}
                style={
                  count > 0
                    ? {
                        background: `rgba(226, 168, 62, ${0.15 + intensity * 0.85})`,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      {/* Deck Accuracy */}
      {stats?.deckAccuracies && stats.deckAccuracies.length > 0 && (
        <div className="bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md mb-4 stagger-6">
          <h2 className="font-display text-[1.125rem] font-bold tracking-tight mb-2">
            Deck Accuracy
          </h2>
          <div className="flex flex-col gap-3">
            {stats.deckAccuracies.map((da) => (
              <div key={da.deckId}>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="font-medium text-text-primary">
                    {da.deckName}
                  </span>
                  <span className="text-text-secondary font-display font-semibold">
                    {Math.round(da.accuracy * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-bg-input rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{
                      width: `${da.accuracy * 100}%`,
                      background:
                        da.accuracy >= 0.7
                          ? "var(--color-accent-success)"
                          : da.accuracy >= 0.4
                            ? "var(--color-accent-warning)"
                            : "var(--color-accent-danger)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Study */}
      {decks.length > 0 && (
        <div className="bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md">
          <h2 className="font-display text-[1.125rem] font-bold tracking-tight mb-4">
            Quick Study
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <button
                key={deck.id}
                className="inline-flex items-center justify-start gap-2 w-full px-5 py-2.5 rounded-sm font-semibold text-sm font-display border border-border bg-bg-card text-text-primary transition-all whitespace-nowrap tracking-tight hover:-translate-y-px hover:bg-bg-card-hover hover:border-border-light disabled:opacity-45 disabled:cursor-not-allowed"
                onClick={() => navigate(`/review/${deck.id}`)}
              >
                <span
                  className="text-[0.65rem]"
                  style={{ color: deck.color ?? "var(--color-accent-primary)" }}
                >
                  ●
                </span>
                {deck.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
