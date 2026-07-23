"use client";

import { useEffect, useRef } from "react";

export default function useWakeLock(active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (
      !active ||
      typeof navigator === "undefined" ||
      !("wakeLock" in navigator)
    ) {
      return;
    }

    let isMounted = true;

    type NavigatorWithWakeLock = Navigator & {
      wakeLock: {
        request: (type: "screen") => Promise<WakeLockSentinel>;
      };
    };

    const requestLock = async () => {
      try {
        const typedNavigator = navigator as NavigatorWithWakeLock;
        const sentinel = await typedNavigator.wakeLock.request("screen");
        if (!isMounted) {
          await sentinel.release();
          return;
        }

        wakeLockRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          wakeLockRef.current = null;
        });
      } catch {
        // Wake lock may be unsupported or denied; ignore.
      }
    };

    requestLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !wakeLockRef.current) {
        requestLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      wakeLockRef.current?.release?.();
      wakeLockRef.current = null;
    };
  }, [active]);
}
