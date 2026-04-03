import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ImportDeckModal from "../../src/components/ImportDeckModal";
import * as api from "../../src/services/api";

vi.mock("../../src/services/api", () => ({
  importDeck: vi.fn(),
}));

vi.mock("../../src/hooks/useLocale", () => ({
  useLocale: () => ({
    t: (key: string) => key,
  }),
}));

describe("ImportDeckModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    return render(
      <ImportDeckModal onClose={mockOnClose} onSuccess={mockOnSuccess} />,
    );
  };

  it("renders the modal and its content", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "decks.importModalTitle" }),
    ).toBeInTheDocument();
    expect(screen.getByText("decks.importFileLabel")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("common.cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles a valid JSON file drop and preview", async () => {
    setup();

    const fileContent = JSON.stringify({
      name: "My Deck",
      description: "My Description",
      cards: [{ front: "FrontA", back: "BackA" }],
    });
    const file = new File([fileContent], "deck.json", {
      type: "application/json",
    });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("deck.json")).toBeInTheDocument();
      expect(screen.getByText("(1 cards)")).toBeInTheDocument();
      expect(screen.getByText("FrontA")).toBeInTheDocument();
    });

    vi.mocked(api.importDeck).mockResolvedValue({
      deck: {
        id: "d1",
        name: "My Deck",
        userId: "u1",
        color: "red",
        createdAt: "",
      },
      cardsCreated: 1,
      errors: [],
    });

    fireEvent.click(screen.getByText("decks.importSubmit"));

    await waitFor(() => {
      expect(api.importDeck).toHaveBeenCalledWith(file, {
        name: "My Deck",
        description: "My Description",
      });
      expect(screen.getByText("decks.importSuccess")).toBeInTheDocument();
    });
  });

  it("handles valid CSV file drop and shows metadata fields", async () => {
    setup();

    const fileContent = `front,back\nA,B`;
    const file = new File([fileContent], "cards.csv", { type: "text/csv" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("cards.csv")).toBeInTheDocument();
      // CSV format requires entering name manually
      expect(screen.getByLabelText("decks.nameLabel")).toBeInTheDocument();
      expect(
        screen.getByLabelText("decks.descriptionLabel"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("decks.nameLabel"), {
      target: { value: "CSV Deck" },
    });

    vi.mocked(api.importDeck).mockResolvedValue({
      deck: {
        id: "d2",
        name: "CSV Deck",
        userId: "u1",
        color: "blue",
        createdAt: "",
      },
      cardsCreated: 1,
      errors: [],
    });

    fireEvent.click(screen.getByText("decks.importSubmit"));

    await waitFor(() => {
      expect(api.importDeck).toHaveBeenCalledWith(file, {
        name: "CSV Deck",
        description: "",
      });
      expect(screen.getByText("decks.importSuccess")).toBeInTheDocument();
    });
  });

  it("displays error on invalid file format", async () => {
    setup();

    const fileContent = "invalid";
    const file = new File([fileContent], "deck.txt", { type: "text/plain" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", { value: [file] });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("decks.importErrorFormat")).toBeInTheDocument();
    });
  });
});
