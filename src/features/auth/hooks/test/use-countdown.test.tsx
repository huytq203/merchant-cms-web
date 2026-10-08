// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCountdown } from "@/features/auth/hooks/use-countdown";

describe("useCountdown", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down once per second and stops at zero", () => {
    const { result } = renderHook(() => useCountdown(3));
    expect(result.current.secondsLeft).toBe(3);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.secondsLeft).toBe(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.secondsLeft).toBe(0);
  });
});
