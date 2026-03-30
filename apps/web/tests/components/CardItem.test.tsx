import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import CardItem from "../../src/components/CardItem";
import { renderWithProviders } from "../test-utils";

const baseCard = {
  id: "card-1",
  deckId: "deck-1",
  front: "What is React?",
  back: "A JavaScript library",
  notes: "",
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

describe("CardItem", () => {
  it("renders front and back text", () => {
    renderWithProviders(
      <CardItem
        card={baseCard}
        index={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("What is React?")).toBeInTheDocument();
    expect(screen.getByText("A JavaScript library")).toBeInTheDocument();
  });

  it('shows "New" badge when reps is 0', () => {
    renderWithProviders(
      <CardItem
        card={baseCard}
        index={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // en locale: t("cards.new") = "New"
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("shows rep count when reps > 0", () => {
    const card = { ...baseCard, reps: 5 };
    renderWithProviders(
      <CardItem card={card} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    // en locale: t("cards.rep") + " " + reps = "Rep 5"
    expect(screen.getByText("Rep 5")).toBeInTheDocument();
  });

  it("renders notes when present", () => {
    const card = { ...baseCard, notes: "Important note" };
    renderWithProviders(
      <CardItem card={card} index={0} onEdit={vi.fn()} onDelete={vi.fn()} />,
    );

    expect(screen.getByText(/Important note/)).toBeInTheDocument();
  });

  it("does not render notes section when notes is null", () => {
    renderWithProviders(
      <CardItem
        card={baseCard}
        index={0}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    // Notes section includes 📝 emoji
    expect(screen.queryByText(/📝/)).not.toBeInTheDocument();
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderWithProviders(
      <CardItem card={baseCard} index={0} onEdit={onEdit} onDelete={vi.fn()} />,
    );

    await user.click(screen.getByLabelText("Edit card"));
    expect(onEdit).toHaveBeenCalledWith(baseCard);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderWithProviders(
      <CardItem
        card={baseCard}
        index={0}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByLabelText("Delete card"));
    expect(onDelete).toHaveBeenCalledWith("card-1");
  });
});
