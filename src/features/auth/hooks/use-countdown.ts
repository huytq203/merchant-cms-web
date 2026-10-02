"use client";

import * as React from "react";

export function useCountdown(initialSeconds: number): { secondsLeft: number } {
  const [secondsLeft, setSecondsLeft] = React.useState(Math.max(0, initialSeconds));

  React.useEffect(() => {
    if (initialSeconds <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [initialSeconds]);

  return { secondsLeft };
}
