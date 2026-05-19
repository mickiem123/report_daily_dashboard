import { afterEach, describe, expect, it, vi } from "vitest";

import { addMetric, addProduct, deleteMetric, deleteProduct } from "@/data/schema-admin";

const { invokeMock, supabaseMock } = vi.hoisted(() => {
  const invoke = vi.fn();
  return { invokeMock: invoke, supabaseMock: { functions: { invoke } } };
});

vi.mock("@/data/supabase", () => ({
  supabase: supabaseMock,
}));

describe("schema admin client", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("invokes add_product action", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await addProduct({ name: "VIP" });

    expect(invokeMock).toHaveBeenCalledWith("schema-admin", {
      body: { action: "add_product", payload: { name: "VIP" } },
    });
  });

  it("throws function errors", async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error("Boom") });

    await expect(addProduct({ name: "VIP" })).rejects.toThrow("Boom");
  });

  it("unwraps Edge Function error response bodies", async () => {
    const error = Object.assign(new Error("Edge Function returned a non-2xx status code"), {
      context: new Response(JSON.stringify({ error: "Invalid JWT" }), { status: 401 }),
    });
    invokeMock.mockResolvedValue({ data: null, error });

    await expect(addProduct({ name: "VIP" })).rejects.toThrow("Invalid JWT");
  });

  it("invokes metric and product delete actions", async () => {
    invokeMock.mockResolvedValue({ data: { ok: true }, error: null });

    await addMetric({ label: "Rate VIP", unit: "%", product_id: "p1", placement: "normal" });
    await deleteMetric({ metric_id: "m1", confirmation: "du_no_vip" });
    await deleteProduct({ product_id: "p1", confirmation: "VIP" });

    expect(invokeMock.mock.calls.map((call) => call[1].body.action)).toEqual([
      "add_metric",
      "delete_metric",
      "delete_product",
    ]);
  });
});
