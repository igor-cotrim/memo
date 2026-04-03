import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ConfirmDialog } from "../../src/components/ui/ConfirmDialog";
import { renderWithProviders } from "../test-utils";

const defaultProps = {
  title: "Delete Item",
  message: "Are you sure?",
  confirmLabel: "Delete",
  cancelLabel: "Cancel",
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe("ConfirmDialog", () => {
  it("renders title, message, and buttons", () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders as a dialog with proper aria attributes", () => {
    renderWithProviders(<ConfirmDialog {...defaultProps} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByText("Delete"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />,
    );

    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when Escape key is pressed", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />,
    );

    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    const { container } = renderWithProviders(
      <ConfirmDialog {...defaultProps} onCancel={onCancel} />,
    );

    const backdrop = container.querySelector(".fixed.inset-0")!;
    await user.click(backdrop);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables buttons while confirm action is in progress", async () => {
    const user = userEvent.setup();
    let resolveConfirm!: () => void;
    const onConfirm = vi.fn(
      () => new Promise<void>((r) => (resolveConfirm = r)),
    );

    renderWithProviders(
      <ConfirmDialog {...defaultProps} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByText("Delete"));

    // Both buttons should be disabled while loading
    expect(screen.getByText("Delete").closest("button")).toBeDisabled();
    expect(screen.getByText("Cancel").closest("button")).toBeDisabled();

    resolveConfirm();
    await waitFor(() => {
      expect(screen.getByText("Delete").closest("button")).not.toBeDisabled();
    });
  });
});
