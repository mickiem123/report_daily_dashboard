import { describe, expect, it } from "vitest";
import { sortCards } from "@/lib/section";
import type { ProductCard } from "@/lib/types";

const makeCard = (key: string, verb: string): ProductCard => ({
  key,
  verb,
  name: key,
  trend_emoji: "",
  headline_label: "",
  headline_value: "0",
  headline_delta: "0",
  sub_metrics: [],
});

describe("sortCards", () => {
  it("sorts by verb bucket then fixed product priority", () => {
    const input = [
      makeCard("momoi", "tăng"),
      makeCard("margin", "giảm"),
      makeCard("phaisinh", "giữ"),
      makeCard("hose", "tăng"),
      makeCard("sfund", "tăng"),
      makeCard("scash", "giữ"),
    ];

    const result = sortCards(input);
    expect(result.map((card) => card.key)).toEqual(["hose", "sfund", "momoi", "phaisinh", "scash", "margin"]);
  });
});
