import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { FieldError } from "../../src/components/ui/FieldError";

describe("FieldError", () => {
  it("renders nothing when message is undefined", () => {
    const { container } = render(<FieldError />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when message is empty string", () => {
    const { container } = render(<FieldError message="" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders error message with alert role", () => {
    render(<FieldError message="This field is required" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("This field is required");
  });
});
