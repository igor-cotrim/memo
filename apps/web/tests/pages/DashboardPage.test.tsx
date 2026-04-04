import { describe, it, expect, beforeEach, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import DashboardPage from "../../src/pages/DashboardPage";
import * as api from "../../src/services/api";
import { renderWithProviders } from "../test-utils";

vi.mock("../../src/services/api");
const mockedApi = vi.mocked(api);

const baseStats = {
  currentStreak: 0,
  last7Days: [] as { date: string; count: number }[],
  last30Days: [] as { date: string; count: number }[],
  last365Days: [] as { date: string; count: number }[],
  deckAccuracies: [] as {
    deckId: string;
    deckName: string;
    totalReviews: number;
    correctReviews: number;
    accuracy: number;
  }[],
};

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedApi.getDueCount.mockResolvedValue({ totalDue: 0 });
  });

  it("shows loading spinner initially", () => {
    mockedApi.getStats.mockReturnValue(new Promise(() => {}));
    mockedApi.getDecks.mockReturnValue(new Promise(() => {}));
    mockedApi.getDueCount.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<DashboardPage />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders dashboard with stats", async () => {
    mockedApi.getStats.mockResolvedValue({
      ...baseStats,
      currentStreak: 5,
      last7Days: [{ date: "2026-03-30", count: 10 }],
    });
    mockedApi.getDecks.mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });
  });

  it("renders deck accuracies", async () => {
    mockedApi.getStats.mockResolvedValue({
      ...baseStats,
      deckAccuracies: [
        {
          deckId: "d-1",
          deckName: "Spanish",
          totalReviews: 20,
          correctReviews: 15,
          accuracy: 0.75,
        },
      ],
    });
    mockedApi.getDecks.mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Spanish")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });

  it("renders quick study section with decks", async () => {
    mockedApi.getStats.mockResolvedValue(baseStats);
    mockedApi.getDecks.mockResolvedValue([
      {
        id: "d-1",
        userId: "u-1",
        name: "French",
        color: "#34d399",
        createdAt: new Date().toISOString(),
      },
    ]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Quick Study")).toBeInTheDocument();
      expect(screen.getByText("French")).toBeInTheDocument();
    });
  });

  it("renders activity graph section", async () => {
    mockedApi.getStats.mockResolvedValue({
      ...baseStats,
      last365Days: [{ date: "2026-03-29", count: 5 }],
    });
    mockedApi.getDecks.mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Review Activity")).toBeInTheDocument();
    });
  });

  it("shows dashboard title and subtitle", async () => {
    mockedApi.getStats.mockResolvedValue(baseStats);
    mockedApi.getDecks.mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(
        screen.getByText("Your learning progress at a glance"),
      ).toBeInTheDocument();
    });
  });

  it("shows due cards banner when there are due cards", async () => {
    mockedApi.getStats.mockResolvedValue(baseStats);
    mockedApi.getDecks.mockResolvedValue([]);
    mockedApi.getDueCount.mockResolvedValue({ totalDue: 5 });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("You have 5 cards ready for review!"),
      ).toBeInTheDocument();
      expect(screen.getByText("Review Now")).toBeInTheDocument();
    });
  });

  it("shows singular banner when there is 1 due card", async () => {
    mockedApi.getStats.mockResolvedValue(baseStats);
    mockedApi.getDecks.mockResolvedValue([]);
    mockedApi.getDueCount.mockResolvedValue({ totalDue: 1 });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText("You have 1 card ready for review!"),
      ).toBeInTheDocument();
    });
  });

  it("does not show due cards banner when count is zero", async () => {
    mockedApi.getStats.mockResolvedValue(baseStats);
    mockedApi.getDecks.mockResolvedValue([]);
    mockedApi.getDueCount.mockResolvedValue({ totalDue: 0 });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    expect(screen.queryByText("Review Now")).not.toBeInTheDocument();
  });
});
