import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ReviewScoreButtons from "../../src/components/ReviewScoreButtons";
import { renderWithProviders } from "../test-utils";

describe("ReviewScoreButtons", () => {
  it("renders 4 quality buttons", () => {
    renderWithProviders(
      <ReviewScoreButtons
        onRate={vi.fn()}
        disabled={false}
        activeQuality={null}
      />,
    );

    expect(screen.getByText("😵")).toBeInTheDocument();
    expect(screen.getByText("😰")).toBeInTheDocument();
    expect(screen.getByText("🤔")).toBeInTheDocument();
    expect(screen.getByText("😎")).toBeInTheDocument();
  });

  it("renders quality labels", () => {
    renderWithProviders(
      <ReviewScoreButtons
        onRate={vi.fn()}
        disabled={false}
        activeQuality={null}
      />,
    );

    expect(screen.getByText("Blackout")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();
    expect(screen.getByText("Good")).toBeInTheDocument();
    expect(screen.getByText("Easy")).toBeInTheDocument();
  });

  it("calls onRate with correct quality when clicked", async () => {
    const user = userEvent.setup();
    const onRate = vi.fn();

    renderWithProviders(
      <ReviewScoreButtons
        onRate={onRate}
        disabled={false}
        activeQuality={null}
      />,
    );

    await user.click(screen.getByText("😵"));
    expect(onRate).toHaveBeenCalledWith(1);

    await user.click(screen.getByText("😰"));
    expect(onRate).toHaveBeenCalledWith(2);

    await user.click(screen.getByText("🤔"));
    expect(onRate).toHaveBeenCalledWith(3);

    await user.click(screen.getByText("😎"));
    expect(onRate).toHaveBeenCalledWith(4);
  });

  it("disables buttons when disabled prop is true", () => {
    renderWithProviders(
      <ReviewScoreButtons
        onRate={vi.fn()}
        disabled={true}
        activeQuality={null}
      />,
    );

    const buttons = screen.getAllByRole("button");
    for (const button of buttons) {
      expect(button).toBeDisabled();
    }
  });
});
