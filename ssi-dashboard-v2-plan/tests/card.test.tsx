import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Card } from "../src/components/Card";
import type { ProductCard } from "../src/lib/types";

function makeProduct(overrides: Partial<ProductCard> = {}): ProductCard {
  return {
    key: "hose",
    name: "HOSE",
    trend_emoji: "📈",
    headline_label: "Thị phần cơ sở",
    headline_value: "12,34%",
    headline_delta: "(+0,23%)",
    verb: "tăng mạnh",
    sub_metrics: [
      { label: "A", value: "100", delta: "+10", important: true },
      { label: "B", value: "N/A", delta: "-5", important: true },
      { label: "C", value: "300", delta: "-2", important: false },
    ],
    ...overrides,
  };
}

describe("Card", () => {
  it("maps verb tăng* to up status and uses status-up aura", () => {
    const { container } = render(<Card product={makeProduct({ verb: "tăng mạnh" })} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-status", "up");
    expect(root.querySelector(".from-status-up\\/20")).toBeInTheDocument();
  });

  it("maps verb giảm* to down status", () => {
    const { container } = render(<Card product={makeProduct({ verb: "giảm" })} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-status", "down");
  });

  it("flips delta color when inverse is true", () => {
    render(
      <Card
        product={makeProduct({
          sub_metrics: [{ label: "Inv", value: "200", delta: "+5", important: true, inverse: true }],
        })}
      />
    );
    expect(screen.getByText("+5")).toHaveClass("text-status-down");
  });

  it("renders only important non-N/A sub metrics", () => {
    render(<Card product={makeProduct()} />);
    expect(screen.getAllByTestId("metric-row")).toHaveLength(1);
    expect(screen.queryByText("B")).not.toBeInTheDocument();
    expect(screen.queryByText("C")).not.toBeInTheDocument();
  });

  it("renders headline value text", () => {
    render(<Card product={makeProduct({ headline_value: "1.234 tỷ" })} />);
    expect(screen.getByText("1.234 tỷ")).toBeInTheDocument();
  });
});
