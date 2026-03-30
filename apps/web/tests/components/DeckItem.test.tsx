import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DeckItem from "../../src/components/DeckItem";
import { renderWithProviders } from "../test-utils";

const baseDeck = {
  id: "deck-1",
  userId: "user-1",
  name: "Spanish Vocab",
  description: "Learn Spanish words",
  color: "#e2a83e",
  createdAt: new Date().toISOString(),
};

describe("DeckItem", () => {
  it("renders deck name and description", () => {
    renderWithProviders(
      <DeckItem
        deck={baseDeck}
        index={0}
        onStudy={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Spanish Vocab")).toBeInTheDocument();
    expect(screen.getByText("Learn Spanish words")).toBeInTheDocument();
  });

  it("renders without description when not provided", () => {
    const deck = { ...baseDeck, description: undefined };
    renderWithProviders(
      <DeckItem
        deck={deck}
        index={0}
        onStudy={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByText("Spanish Vocab")).toBeInTheDocument();
  });

  it("calls onClick when clicking the deck card", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderWithProviders(
      <DeckItem
        deck={baseDeck}
        index={0}
        onStudy={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClick={onClick}
      />,
    );

    await user.click(screen.getByText("Spanish Vocab"));
    expect(onClick).toHaveBeenCalledWith("deck-1");
  });

  it("calls onStudy when study button is clicked", async () => {
    const user = userEvent.setup();
    const onStudy = vi.fn();

    renderWithProviders(
      <DeckItem
        deck={baseDeck}
        index={0}
        onStudy={onStudy}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    // Translated: "▶ Study"
    await user.click(screen.getByText("▶ Study"));
    expect(onStudy).toHaveBeenCalledWith("deck-1");
  });

  it("calls onEdit when edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderWithProviders(
      <DeckItem
        deck={baseDeck}
        index={0}
        onStudy={vi.fn()}
        onEdit={onEdit}
        onDelete={vi.fn()}
        onClick={vi.fn()}
      />,
    );

    await user.click(screen.getByText("✎ Edit"));
    expect(onEdit).toHaveBeenCalledWith(baseDeck);
  });

  it("calls onDelete when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderWithProviders(
      <DeckItem
        deck={baseDeck}
        index={0}
        onStudy={vi.fn()}
        onEdit={vi.fn()}
        onDelete={onDelete}
        onClick={vi.fn()}
      />,
    );

    await user.click(screen.getByText("✕ Delete"));
    expect(onDelete).toHaveBeenCalledWith("deck-1");
  });
});
