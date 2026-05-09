import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BgPattern } from "../src/components/BgPattern";

describe("BgPattern", () => {
  it("renders animated path background container and svg layers", () => {
    const { container } = render(<BgPattern />);
    const pattern = container.firstElementChild as HTMLElement;

    expect(pattern).toBeInTheDocument();
    expect(pattern).toHaveClass("absolute", "inset-0", "-z-10", "overflow-hidden");
    expect(pattern.querySelectorAll("svg")).toHaveLength(2);
    expect(pattern.querySelectorAll("path").length).toBeGreaterThan(0);
  });
});
