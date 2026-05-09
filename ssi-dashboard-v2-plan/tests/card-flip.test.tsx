import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Card } from "../src/components/Card";
import type { ProductCard } from "../src/lib/types";

function makeProduct(overrides: Partial<ProductCard> = {}): ProductCard {
  return {
    key: "margin",
    name: "Margin",
    trend_emoji: "📈",
    headline_label: "Dư nợ margin",
    headline_value: "1.000 tỷ",
    headline_delta: "(+2%)",
    verb: "tăng",
    sub_metrics: [
      { label: "Dư nợ T+7", value: "100", delta: "+10", important: true, group: "T+7" },
      { label: "SLKH T+7", value: "10", delta: "+1", important: false, group: "T+7" },
      { label: "Dư nợ Trading Plus", value: "200", delta: "+5", important: false, group: "Trading Plus" },
      { label: "Dư nợ M+", value: "300", delta: "-2", important: false, group: "M+" },
      { label: "Tổng dư nợ", value: "600", delta: "+13", important: true },
    ],
    ...overrides,
  };
}

function mockReducedMotion(matches: boolean) {
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();
  const matchMedia = vi.fn().mockReturnValue({
    matches,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
  Object.defineProperty(window, "matchMedia", { writable: true, configurable: true, value: matchMedia });
  return { addEventListener, removeEventListener };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Card flip", () => {
  it("keeps front and back faces mounted for the 3D flipper", () => {
    render(<Card product={makeProduct()} />);
    expect(screen.getByTestId("card-front-face")).toBeInTheDocument();
    expect(screen.getByTestId("card-back-face")).toBeInTheDocument();
  });

  it("shows grouped margin back face and keeps group order after flip", async () => {
    const user = userEvent.setup();
    render(<Card product={makeProduct()} />);

    const card = screen.getByRole("button");
    await user.click(card);
    const backFace = screen.getByTestId("card-back-face");
    const back = within(backFace);

    const t7 = back.getByText("T+7");
    const tradingPlus = back.getByText("Trading Plus");
    const mplus = back.getByText("M+");
    expect(t7.compareDocumentPosition(tradingPlus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tradingPlus.compareDocumentPosition(mplus) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(back.getByText("Tổng dư nợ")).toBeInTheDocument();
  });

  it("toggles aria-pressed on each flip", async () => {
    const user = userEvent.setup();
    render(<Card product={makeProduct()} />);

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-pressed", "false");

    await user.click(card);
    expect(card).toHaveAttribute("aria-pressed", "true");

    await user.click(card);
    expect(card).toHaveAttribute("aria-pressed", "false");
  });

  it("flips back to front on second click", async () => {
    const user = userEvent.setup();
    render(<Card product={makeProduct()} />);

    const card = screen.getByRole("button");
    await user.click(card);
    await user.click(card);

    expect(card).toHaveAttribute("data-flipped", "false");
    expect(screen.getByText("Dư nợ margin")).toBeInTheDocument();
  });

  it("keeps inverse delta color logic on back face for phaisinh D+", async () => {
    const user = userEvent.setup();
    render(
      <Card
        product={makeProduct({
          key: "phaisinh",
          name: "Phái sinh",
          sub_metrics: [
            { label: "KH hủy D+", value: "120", delta: "+7", important: true, group: "D+", inverse: true },
            { label: "SLKH D+", value: "400", delta: "+10", important: true, group: "D+" },
          ],
        })}
      />
    );

    await user.click(screen.getByRole("button"));
    const back = within(screen.getByTestId("card-back-face"));
    expect(back.getByText("D+")).toBeInTheDocument();
    expect(back.getByText("+7")).toHaveClass("text-status-down");
  });

  it("renders HOSE back face as ungrouped list only", async () => {
    const user = userEvent.setup();
    render(
      <Card
        product={makeProduct({
          key: "hose",
          name: "HOSE",
          sub_metrics: [
            { label: "GTGD", value: "1.000", delta: "+2", important: true },
            { label: "Thanh khoản", value: "500", delta: "-1", important: false },
          ],
        })}
      />
    );

    await user.click(screen.getByRole("button"));
    const back = within(screen.getByTestId("card-back-face"));
    expect(back.getByText("GTGD")).toBeInTheDocument();
    expect(back.getByText("Thanh khoản")).toBeInTheDocument();
    expect(back.queryByText("D+")).not.toBeInTheDocument();
    expect(back.queryByText("T+7")).not.toBeInTheDocument();
    expect(back.queryByText("Trading Plus")).not.toBeInTheDocument();
    expect(back.queryByText("M+")).not.toBeInTheDocument();
  });

  it("disables transition and hover motion when reduced motion is enabled", () => {
    const media = mockReducedMotion(true);
    render(<Card product={makeProduct()} />);

    const card = screen.getByRole("button");
    expect(card.className).not.toContain("hover:-translate-y-1");
    expect(card.className).not.toContain("transition-all");
    expect(screen.getByTestId("card-front-face").parentElement).toHaveStyle({ transition: "none" });
    expect(media.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
