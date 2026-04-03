import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import type { ReviewStats, Deck } from "@flashcard-app/shared-types";
import { useLocale } from "../hooks/useLocale";
import { useAuth } from "../hooks/useAuth";
import * as api from "../services/api";
import { Button, Spinner, PageHeader } from "../components/ui";
import ActivityGraph from "../components/ActivityGraph";
import EmptyState from "../components/EmptyState";
import OnboardingWizard from "../components/OnboardingWizard";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { user, updateUser } = useAuth();
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(
    () => user?.onboardingCompletedAt === null,
  );

  async function handleOnboardingComplete() {
    setShowOnboarding(false);
    try {
      const { user: updatedUser } = await api.completeOnboarding();
      updateUser(updatedUser);
    } catch {
      // Silently fail — worst case they see it again next login
    }
  }

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

  const todayCount = useMemo(() => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    return stats?.last7Days.find((d) => d.date === dateStr)?.count ?? 0;
  }, [stats]);

  const weekTotal = useMemo(
    () => stats?.last7Days.reduce((sum, d) => sum + d.count, 0) ?? 0,
    [stats],
  );

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      {showOnboarding && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}

      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
      />

      {/* Stats Overview */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-1">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {stats?.currentStreak ?? 0}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            {t("dashboard.dayStreak")}
          </div>
        </div>
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-2">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {todayCount}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            {t("dashboard.reviewedToday")}
          </div>
        </div>
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-3">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {weekTotal}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            {t("dashboard.thisWeek")}
          </div>
        </div>
        <div className="text-center p-7 bg-bg-card border border-border rounded-md transition-all hover:border-border-light hover:shadow-md stagger-4">
          <div className="font-display text-[2.5rem] font-extrabold text-accent-primary leading-[1.2] tabular-nums tracking-tight">
            {decks.length}
          </div>
          <div className="text-text-secondary font-display text-xs font-semibold uppercase tracking-widest mt-1.5">
            {t("dashboard.totalDecks")}
          </div>
        </div>
      </div>

      {/* Activity Graph */}
      <div className="bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md mb-4 stagger-5">
        <h2 className="font-display text-[1.125rem] font-bold tracking-tight mb-4">
          {t("dashboard.reviewActivity")}
        </h2>
        <ActivityGraph data={stats?.last365Days ?? []} />
      </div>

      {/* Deck Accuracy */}
      {stats?.deckAccuracies && stats.deckAccuracies.length > 0 && (
        <div className="bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md mb-4 stagger-6">
          <h2 className="font-display text-[1.125rem] font-bold tracking-tight mb-2">
            {t("dashboard.deckAccuracy")}
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

      {/* Quick Study / Empty CTA */}
      {decks.length === 0 ? (
        <EmptyState
          icon="📚"
          title={t("dashboard.createFirstDeck")}
          description={t("dashboard.createFirstDeckText")}
          action={
            <Button onClick={() => navigate("/decks")}>
              {t("dashboard.createDeck")}
            </Button>
          }
        />
      ) : (
        <div className="bg-bg-card border border-border rounded-md p-6 transition-all hover:border-border-light hover:shadow-md">
          <h2 className="font-display text-[1.125rem] font-bold tracking-tight mb-4">
            {t("dashboard.quickStudy")}
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <Button
                key={deck.id}
                variant="secondary"
                className="w-full justify-start"
                onClick={() => navigate(`/review/${deck.id}`)}
              >
                <span
                  className="text-[0.65rem]"
                  style={{ color: deck.color ?? "var(--color-accent-primary)" }}
                >
                  ●
                </span>
                {deck.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
