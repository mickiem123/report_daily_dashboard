import { describe, expect, it } from "vitest";

describe("supabase client env handling", () => {
  it("can be imported without local Vite env vars", async () => {
    await expect(import("@/data/supabase")).resolves.toHaveProperty("supabase");
  });
});
