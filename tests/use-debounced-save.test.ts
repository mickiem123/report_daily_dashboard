import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedSave } from "@/lib/use-debounced-save";

describe("useDebouncedSave", () => {
  it("coalesces rapid calls into one save after delay", async () => {
    vi.useFakeTimers();
    const saveFn = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebouncedSave(saveFn, 1000));

    act(() => {
      result.current.save("A");
      vi.advanceTimersByTime(50);
      result.current.save("B");
      vi.advanceTimersByTime(50);
      result.current.save("C");
    });

    expect(saveFn).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(saveFn).toHaveBeenCalledTimes(1);
    expect(saveFn).toHaveBeenCalledWith("C");
    expect(result.current.status).toBe("saved");
    vi.useRealTimers();
  });
});
