import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ReviewCard from "../../src/components/ReviewCard";
import { renderWithProviders } from "../test-utils";

const baseCard = {
  id: "card-1",
  deckId: "deck-1",
  front: "What is TypeScript?",
  back: "A typed superset of JavaScript",
  notes: "Important concept",
  state: 0,
  due: new Date().toISOString(),
  stability: 0,
  difficulty: 0,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
  lastReviewAt: null,
  createdAt: new Date().toISOString(),
};

describe("ReviewCard", () => {
  it("renders the front of the card", () => {
    renderWithProviders(
      <ReviewCard card={baseCard} isFlipped={false} onFlip={vi.fn()} />,
    );

    expect(screen.getByText("What is TypeScript?")).toBeInTheDocument();
  });

  it("renders the back of the card when flipped", () => {
    renderWithProviders(
      <ReviewCard card={baseCard} isFlipped={true} onFlip={vi.fn()} />,
    );

    expect(
      screen.getByText("A typed superset of JavaScript"),
    ).toBeInTheDocument();
  });

  it("renders notes on the back", () => {
    renderWithProviders(
      <ReviewCard card={baseCard} isFlipped={true} onFlip={vi.fn()} />,
    );

    expect(screen.getByText(/Important concept/)).toBeInTheDocument();
  });

  it("does not render notes when null", () => {
    const card = { ...baseCard, notes: "" };
    renderWithProviders(
      <ReviewCard card={card} isFlipped={true} onFlip={vi.fn()} />,
    );

    expect(screen.queryByText(/📝/)).not.toBeInTheDocument();
  });

  it("calls onFlip when clicked", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();

    renderWithProviders(
      <ReviewCard card={baseCard} isFlipped={false} onFlip={onFlip} />,
    );

    await user.click(screen.getByText("What is TypeScript?"));
    expect(onFlip).toHaveBeenCalled();
  });

  it("shows Front and Back labels", () => {
    renderWithProviders(
      <ReviewCard card={baseCard} isFlipped={false} onFlip={vi.fn()} />,
    );

    // en locale: "Front" and "Back"
    expect(screen.getByText("Front")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });
});
