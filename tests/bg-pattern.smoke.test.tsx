import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BgPattern } from "../src/components/BgPattern";

describe("BgPattern", () => {
  it("renders subtle moving background layers without svg paths", () => {
    const { container } = render(<BgPattern />);
    const pattern = container.firstElementChild as HTMLElement;

    expect(pattern).toBeInTheDocument();
    expect(pattern).toHaveClass("absolute", "inset-0", "z-0", "overflow-hidden");
    expect(pattern.querySelector(".bg-supabase-grid")).toBeInTheDocument();
    expect(pattern.querySelector(".bg-drift-slow")).toBeInTheDocument();
    expect(pattern.querySelector(".bg-drift-reverse")).toBeInTheDocument();
    expect(pattern.querySelectorAll("svg")).toHaveLength(0);
  });
});
