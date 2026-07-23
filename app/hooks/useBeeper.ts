"use client";

import { useCallback, useRef } from "react";

export default function useBeeper() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(() => {
    if (ctxRef.current) {
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume().catch(() => undefined);
      }
      return ctxRef.current;
    }

    const win = window as unknown as Window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = win.AudioContext ?? win.webkitAudioContext;
    if (!Ctor) {
      ctxRef.current = null;
      return null;
    }

    try {
      const ctx = new Ctor();
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => undefined);
      }
      ctxRef.current = ctx;
    } catch {
      ctxRef.current = null;
    }

    return ctxRef.current;
  }, []);

  return useCallback(
    (freq: number, durationMs: number, gain = 0.05) => {
      try {
        const ctx = ensureCtx();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;
        g.gain.value = gain;

        osc.connect(g);
        g.connect(ctx.destination);

        const now = ctx.currentTime;
        osc.start(now);
        osc.stop(now + durationMs / 1000);
      } catch {
        // ignore audio failover
      }
    },
    [ensureCtx],
  );
}
