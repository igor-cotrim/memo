import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import EmptyState from "../../src/components/EmptyState";

describe("EmptyState", () => {
  it("renders icon, title, and description", () => {
    render(
      <EmptyState icon="📚" title="No items" description="Nothing here yet" />,
    );

    expect(screen.getByText("📚")).toBeInTheDocument();
    expect(screen.getByText("No items")).toBeInTheDocument();
    expect(screen.getByText("Nothing here yet")).toBeInTheDocument();
  });

  it("renders action when provided", () => {
    render(
      <EmptyState
        icon="📚"
        title="No items"
        description="Nothing here yet"
        action={<button>Create</button>}
      />,
    );

    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  it("does not render action container when not provided", () => {
    const { container } = render(
      <EmptyState icon="📚" title="No items" description="Nothing here yet" />,
    );

    // The action div should not exist
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("renders ReactNode as icon", () => {
    render(
      <EmptyState
        icon={<span data-testid="custom-icon">🎉</span>}
        title="Done"
        description="All done"
      />,
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });
});
