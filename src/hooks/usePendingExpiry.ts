"use client";

import { useEffect, useState } from "react";

export interface ExpiryState {
  secondsLeft: number | null;
  isExpired: boolean;
}

export function usePendingExpiry(expiresAt: string | undefined): ExpiryState {
  const target = expiresAt ? Date.parse(expiresAt) : NaN;
  const valid = Number.isFinite(target);

  const compute = (): number | null => {
    if (!valid) return null;
    return Math.max(0, Math.floor((target - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState<number | null>(compute);

  useEffect(() => {
    if (!valid) {
      setSecondsLeft(null);
      return;
    }
    setSecondsLeft(compute());
    const id = setInterval(() => {
      setSecondsLeft(compute());
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  return {
    secondsLeft,
    isExpired: secondsLeft != null && secondsLeft <= 0,
  };
}
