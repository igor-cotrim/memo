import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import ImportCardsModal from "../../src/components/ImportCardsModal";
import * as api from "../../src/services/api";

vi.mock("../../src/services/api", () => ({
  importCards: vi.fn(),
}));

vi.mock("../../src/hooks/useLocale", () => ({
  useLocale: () => ({
    t: (key: string) => key, // simple pass-through mock
  }),
}));

describe("ImportCardsModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = () => {
    return render(
      <ImportCardsModal
        deckId="deck1"
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );
  };

  it("renders the modal and its content", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "cards.importModalTitle" }),
    ).toBeInTheDocument();
    expect(screen.getByText("cards.importFileLabel")).toBeInTheDocument();
  });

  it("calls onClose when cancel is clicked", () => {
    setup();
    fireEvent.click(screen.getByText("common.cancel"));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles a valid JSON file drop and preview", async () => {
    setup();

    const fileContent = JSON.stringify([
      { front: "FrontA", back: "BackA" },
      { front: "FrontB", back: "BackB" },
    ]);
    const file = new File([fileContent], "cards.json", {
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
      expect(screen.getByText("cards.json")).toBeInTheDocument();
      expect(screen.getByText("(2 cards)")).toBeInTheDocument();
      expect(screen.getByText("FrontA")).toBeInTheDocument();
      expect(screen.getByText("BackB")).toBeInTheDocument();
    });

    vi.mocked(api.importCards).mockResolvedValue({
      cardsCreated: 2,
      errors: [],
    });

    fireEvent.click(screen.getByText("cards.importSubmit"));

    await waitFor(() => {
      expect(api.importCards).toHaveBeenCalledWith("deck1", file);
      expect(screen.getByText("cards.importSuccess")).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(mockOnSuccess).toHaveBeenCalled();
      },
      { timeout: 1500 },
    );
  });

  it("displays error on invalid file extension", async () => {
    setup();

    const fileContent = "some text";
    const file = new File([fileContent], "cards.txt", { type: "text/plain" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    Object.defineProperty(input, "files", {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText("cards.importErrorFormat")).toBeInTheDocument();
    });
  });

  it("handles valid CSV file drop", async () => {
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
      expect(screen.getByText("(1 cards)")).toBeInTheDocument();
    });
  });
});
