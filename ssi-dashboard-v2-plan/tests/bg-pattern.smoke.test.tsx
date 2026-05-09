import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BgPattern } from "../src/components/BgPattern";

describe("BgPattern", () => {
  it("renders the expected structural classes", () => {
    const { container } = render(<BgPattern />);
    const pattern = container.firstElementChild;

    expect(pattern).toBeInTheDocument();
    expect(pattern).toHaveClass("absolute", "inset-0", "-z-10", "bg-drift");
  });
});
