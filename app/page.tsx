"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type KettlebellMode = "single" | "double";
type Screen = "setup" | "running" | "complete";

interface WorkoutConfig {
  mode: KettlebellMode;
  rounds: number;
}

const EMOM_INTERVAL_SECONDS = 60;

const DEFAULT_CONFIG: WorkoutConfig = {
  mode: "double",
  rounds: 10,
};

const ROUNDS_PRESETS = [5, 6, 8, 10, 15, 20];
const MIN_CUSTOM_ROUNDS = 1;
const MAX_CUSTOM_ROUNDS = 60;
const TICK_COUNT = 12;
const DIGIT_REGEX = /\D/g;

const pageStyles = `
        :root {
          --iron-900: #0c0c0b;
          --iron-800: #171716;
          --iron-700: #232220;
          --iron-600: #302e2b;
          --iron-500: #46433e;
          --iron-line: #3a3733;
          --steel: #d9d5c9;
          --steel-dim: #8f8b80;
          --brass: #b6924f;
          --brass-bright: #d3ac68;
          --ember: #c1440e;
          --ember-bright: #e8630f;
          --ember-glow: rgba(193, 68, 14, 0.45);
        }

        * { box-sizing: border-box; }

        html, body { margin: 0; min-height: 100%; background: #07090e; }

        .page {
          min-height: 100vh;
          min-width: 100vw;
          position: relative;
          background: radial-gradient(circle at 50% 12%, rgba(255,255,255,0.05), transparent 22%),
            radial-gradient(circle at 85% 95%, rgba(232, 98, 37, 0.08), transparent 18%),
            #080a0d;
          color: var(--steel);
          font-family: var(--font-sans), sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: hidden;
        }

        .page::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent 28%);
        }

        .page::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          box-shadow: inset 0 0 140px rgba(0,0,0,0.6);
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .card {
          width: min(760px, 100%);
          max-width: 760px;
          min-height: min(calc(100vh - 40px), 900px);
          position: relative;
          z-index: 1;
          background: rgba(8, 10, 15, 0.88);
          border-radius: 32px;
          padding: 32px 28px 32px;
          box-shadow: 0 24px 90px rgba(0,0,0,0.28);
          display: grid;
          gap: 24px;
          overflow: hidden;
          backdrop-filter: blur(16px);
        }

        .eyebrow {
          font-family: var(--font-code), monospace;
          font-size: 12px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: var(--brass-bright);
          margin: 0 0 6px;
        }

        .title {
          font-family: var(--font-display), sans-serif;
          font-weight: 700;
          font-size: 34px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          margin: 0 0 10px;
          line-height: 1.05;
          color: var(--steel);
        }

        .subtitle {
          color: var(--steel-dim);
          font-size: 15px;
          margin: 0 0 24px;
          line-height: 1.7;
          max-width: 70ch;
        }

        .complex-line {
          position: relative;
          font-family: var(--font-code), monospace;
          color: var(--steel);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 22px;
          padding: 22px;
          margin-bottom: 26px;
          display: grid;
          gap: 16px;
          line-height: 1.55;
          white-space: normal;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .complex-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 12px;
        }
        .complex-card {
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 18px 16px;
          background: rgba(255,255,255,0.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          display: grid;
          gap: 8px;
          color: var(--steel);
        }
        .complex-card span,
        .complex-card .side-label {
          color: var(--brass-bright);
          font-weight: 700;
        }
        .complex-card .side-label {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
        }
        .complex-card div:not(.side-label) {
          font-size: 14px;
        }
        .complex-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .complex-line > .complex-card {
          min-width: 0;
        }
        @media (max-width: 520px) {
          .complex-grid {
            grid-template-columns: 1fr;
          }
        }

        .section-label {
          font-family: var(--font-code), monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--steel-dim);
          margin: 0 0 10px;
        }

        .segmented {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 26px;
        }

        .segmented button,
        .preset-row button {
          font-family: var(--font-display), sans-serif;
          font-size: 14px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--steel-dim);
          border-radius: 14px;
          padding: 14px 12px;
          cursor: pointer;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
          transition: border-color 0.15s ease, color 0.15s ease, transform 0.1s ease;
        }

        .segmented button:hover,
        .preset-row button:hover {
          border-color: var(--brass);
          color: var(--steel);
        }

        .segmented button:active,
        .preset-row button:active {
          transform: translateY(1px);
        }

        .segmented button.active {
          background: linear-gradient(180deg, rgba(232, 98, 37, 0.14), rgba(255, 136, 74, 0.18));
          border-color: rgba(232, 98, 37, 0.35);
          color: var(--steel);
          font-weight: 600;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
        }

        .field-row {
          margin-bottom: 26px;
        }

        .field-row-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .field-value {
          font-family: var(--font-code), monospace;
          font-size: 15px;
          color: var(--brass-bright);
        }

        .preset-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .preset-row button {
          font-size: 13px;
          padding: 10px 4px;
        }

        .preset-row button.active {
          background: linear-gradient(180deg, var(--brass-bright), var(--brass));
          border-color: var(--brass);
          color: #201705;
          font-weight: 600;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.3),
            inset 0 -3px 6px rgba(0,0,0,0.25);
        }

        .custom-round-input-container {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) auto;
          gap: 8px;
          align-items: center;
        }

        .custom-round-input {
          width: 100%;
          min-width: 0;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          color: var(--steel);
          padding: 14px 12px;
          font-family: var(--font-code), monospace;
          font-size: 14px;
          outline: none;
        }

        .custom-round-input:focus {
          border-color: var(--brass);
          box-shadow: 0 0 0 3px rgba(182, 146, 79, 0.12);
        }

        .custom-round-button {
          border-radius: 4px;
          border: 1px solid var(--iron-line);
          background: linear-gradient(180deg, var(--iron-600), var(--iron-700));
          color: var(--steel);
          padding: 12px 14px;
          font-family: var(--font-display), sans-serif;
          font-size: 13px;
          text-transform: uppercase;
          cursor: pointer;
        }

        .custom-round-button:hover {
          border-color: var(--brass);
          color: var(--steel);
        }

        .custom-round-error {
          margin-top: 10px;
          font-size: 12px;
          color: #f2b6a0;
          font-family: var(--font-code), monospace;
        }

        .totals {
          font-family: var(--font-code), monospace;
          font-size: 18px;
          color: var(--steel-dim);
          text-align: center;
          margin-bottom: 22px;
        }
        .totals span { color: var(--steel); }

        .start-btn {
          position: relative;
          width: 100%;
          font-family: var(--font-display), sans-serif;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: linear-gradient(180deg, rgba(232, 98, 37, 0.95), rgba(220, 72, 16, 1));
          color: #fff;
          border: none;
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          box-shadow: 0 16px 30px rgba(232, 98, 37, 0.18);
          transition: transform 0.12s ease, box-shadow 0.15s ease;
        }
        .start-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 36px rgba(232, 98, 37, 0.22);
        }
        .start-btn:active {
          transform: translateY(1px);
          box-shadow: 0 12px 20px rgba(232, 98, 37, 0.2);
        }

        .segmented button:focus-visible,
        .preset-row button:focus-visible,
        .custom-round-input:focus-visible,
        .start-btn:focus-visible,
        .run-controls button:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.16), 0 0 0 4px rgba(219, 139, 42, 0.45);
        }

        .run-wrap {
          display: grid;
          gap: 20px;
          place-items: center;
          text-align: center;
          width: 100%;
          max-width: 560px;
          margin: 0 auto;
        }

        .run-eyebrow {
          font-family: var(--font-code), monospace;
          font-size: 12px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--steel-dim);
          margin-bottom: 6px;
        }

        .round-indicator {
          font-family: var(--font-display), sans-serif;
          font-size: 15px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--steel);
          margin-bottom: 26px;
        }
        .round-indicator span { color: var(--brass-bright); }

        .dial-wrap {
          position: relative;
          width: min(300px, 100%);
          aspect-ratio: 1;
          margin-bottom: 26px;
          max-width: 300px;
        }

        .dial-plate {
          position: absolute;
          inset: 14px;
          border-radius: 50%;
          background: radial-gradient(circle at 38% 32%, #35322d 0%, #201e1a 55%, #131210 100%);
          box-shadow:
            inset 0 3px 6px rgba(0,0,0,0.7),
            inset 0 -2px 4px rgba(255,255,255,0.04),
            0 6px 18px rgba(0,0,0,0.6);
        }

        .dial-svg { position: relative; transform: rotate(-90deg); }

        .dial-track { fill: none; stroke: #100f0d; stroke-width: 4; }
        .dial-bezel { fill: none; stroke: var(--iron-line); stroke-width: 1; }
        .tick { stroke: var(--iron-500); stroke-width: 2; }
        .dial-progress {
          fill: none;
          stroke: var(--brass);
          stroke-width: 4;
          stroke-linecap: round;
          filter: drop-shadow(0 0 4px rgba(182, 146, 79, 0.5));
          transition: stroke-dashoffset 0.15s linear, stroke 0.2s ease;
        }
        .dial-progress.urgent {
          stroke: var(--ember-bright);
          filter: drop-shadow(0 0 10px var(--ember-glow));
        }

        .dial-center {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .big-time {
          font-family: var(--font-display), sans-serif;
          font-weight: 600;
          font-size: clamp(44px, 8vw, 88px);
          line-height: 1;
          letter-spacing: 0.01em;
          font-variant-numeric: tabular-nums;
          color: var(--steel);
          text-shadow:
            0 1px 0 rgba(255,255,255,0.08),
            0 3px 6px rgba(0,0,0,0.8);
          min-height: 1em;
          white-space: nowrap;
        }
        .big-time.urgent {
          color: var(--ember-bright);
          text-shadow:
            0 0 18px var(--ember-glow),
            0 3px 6px rgba(0,0,0,0.8);
          animation: throb 1s ease-in-out infinite;
        }

        @keyframes throb {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }

        .arm-badge {
          margin-top: 10px;
          font-family: var(--font-code), monospace;
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #1c1509;
          background: linear-gradient(180deg, var(--brass-bright), var(--brass));
          border-radius: 999px;
          padding: 5px 14px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.3);
        }

        .reps-reminder {
          font-family: var(--font-code), monospace;
          font-size: 14px;
          color: var(--steel-dim);
          margin-bottom: 28px;
        }
        .reps-reminder b { color: var(--steel); font-weight: 600; }

        .run-controls {
          display: flex;
          gap: 12px;
          width: 100%;
          justify-content: center;
        }

        .run-controls button {
          flex: 1;
          min-width: 130px;
          font-family: var(--font-display), sans-serif;
          font-size: 14px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          padding: 14px 18px;
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.05);
          color: var(--steel);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          transition: border-color 0.15s ease, transform 0.12s ease, background 0.15s ease;
        }
        .run-controls button:hover {
          border-color: rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
        }
        .run-controls button:active {
          transform: translateY(1px);
        }
        .run-controls button.end {
          color: var(--steel-dim);
          background: rgba(255,255,255,0.03);
        }

        .complete-wrap { text-align: center; }
        .complete-eyebrow {
          font-family: var(--font-code), monospace;
          font-size: 12px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--brass-bright);
          margin-bottom: 10px;
        }
        .complete-title {
          font-family: var(--font-display), sans-serif;
          font-weight: 700;
          font-size: 40px;
          text-transform: uppercase;
          margin: 0 0 20px;
          color: var(--steel);
          text-shadow: 0 1px 0 rgba(255,255,255,0.06), 0 2px 3px rgba(0,0,0,0.7);
        }
        .complete-stats {
          display: flex;
          justify-content: center;
          gap: 36px;
          margin-bottom: 32px;
        }
        .complete-stat-value {
          font-family: var(--font-display), sans-serif;
          font-size: 32px;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          color: var(--steel);
        }
        .complete-stat-label {
          font-family: var(--font-code), monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--steel-dim);
          margin-top: 4px;
        }

        @media (max-width: 860px) {
          .card {
            width: 100%;
            min-height: auto;
            padding: 28px 20px 24px;
          }
          .complex-line {
            padding: 16px;
          }
          .preset-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .dial-wrap {
            width: 100%;
            max-width: 260px;
            aspect-ratio: auto;
            margin-bottom: 20px;
            padding: 0;
            min-height: 0;
          }
          .dial-plate,
          .dial-svg,
          .dial-track,
          .dial-bezel,
          .tick,
          .dial-progress {
            display: none;
          }
          .dial-center {
            position: static;
            display: flex;
            width: 100%;
            padding: 18px 0;
            justify-content: center;
            align-items: center;
          }
          .big-time {
            font-size: clamp(56px, 16vw, 80px);
            line-height: 1.05;
            text-shadow: none;
          }
          .title { font-size: 28px; }
          .card { padding: 24px 18px 22px; }
          .preset-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .round-indicator {
            font-size: 13px;
            margin-bottom: 18px;
          }
          .reps-reminder {
            font-size: 13px;
            margin-bottom: 24px;
          }
        }
      `;

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, "0")}`;
}

function useBeeper() {
  const ctxRef = useRef<AudioContext | null>(null);

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) {
      const Ctor =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      try {
        ctxRef.current = new Ctor();
      } catch {
        ctxRef.current = null;
      }
    }
    return ctxRef.current;
  }, []);

  const beep = useCallback(
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
        // ignore audio errors
      }
    },
    [ensureCtx],
  );

  return beep;
}

export default function Page() {
  const [config, setConfig] = useState<WorkoutConfig>(DEFAULT_CONFIG);
  const [screen, setScreen] = useState<Screen>("setup");
  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(EMOM_INTERVAL_SECONDS);
  const [isPaused, setIsPaused] = useState(false);

  const endTimeRef = useRef<number>(0);
  const lastBeepMarkRef = useRef<number>(-1);
  const beep = useBeeper();
  const totalWorkoutSeconds = config.rounds * EMOM_INTERVAL_SECONDS;

  const startWorkout = () => {
    setRound(1);
    setSecondsLeft(EMOM_INTERVAL_SECONDS);
    endTimeRef.current = Date.now() + EMOM_INTERVAL_SECONDS * 1000;
    lastBeepMarkRef.current = -1;
    setIsPaused(false);
    setScreen("running");
    beep(660, 150, 0.06);
  };

  const resetWorkout = () => {
    setScreen("setup");
    setRound(1);
    setSecondsLeft(EMOM_INTERVAL_SECONDS);
    setIsPaused(false);
  };

  const togglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        setSecondsLeft(Math.max(0, (endTimeRef.current - Date.now()) / 1000));
      } else {
        endTimeRef.current = Date.now() + secondsLeft * 1000;
      }
      return next;
    });
  };

  useEffect(() => {
    if (screen !== "running" || isPaused) return;

    const tick = () => {
      const remainingMs = endTimeRef.current - Date.now();
      const remaining = remainingMs / 1000;

      if (remaining <= 0) {
        if (round >= config.rounds) {
          setSecondsLeft(0);
          setScreen("complete");
          beep(880, 300, 0.08);
          window.setTimeout(() => beep(1046, 350, 0.08), 260);
          return;
        }

        const nextRound = round + 1;
        endTimeRef.current = Date.now() + EMOM_INTERVAL_SECONDS * 1000;
        lastBeepMarkRef.current = -1;
        setRound(nextRound);
        setSecondsLeft(EMOM_INTERVAL_SECONDS);
        beep(740, 180, 0.07);
        return;
      }

      setSecondsLeft(remaining);

      const wholeSecondsLeft = Math.ceil(remaining);
      if (
        wholeSecondsLeft <= 3 &&
        wholeSecondsLeft >= 1 &&
        lastBeepMarkRef.current !== wholeSecondsLeft
      ) {
        lastBeepMarkRef.current = wholeSecondsLeft;
        beep(520, 90, 0.045);
      }
    };

    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [screen, isPaused, round, config.rounds]);

  const armLabel =
    config.mode === "single"
      ? round % 2 === 1
        ? "Right squats first"
        : "Left squats first"
      : null;

  const progressFraction =
    (EMOM_INTERVAL_SECONDS - secondsLeft) / EMOM_INTERVAL_SECONDS;

  return (
    <div className="page">
      <style>{pageStyles}</style>
      <div className="card">
        {screen === "setup" && (
          <SetupScreen
            config={config}
            setConfig={setConfig}
            totalWorkoutSeconds={totalWorkoutSeconds}
            onStart={startWorkout}
          />
        )}

        {screen === "running" && (
          <RunningScreen
            config={config}
            round={round}
            secondsLeft={secondsLeft}
            isPaused={isPaused}
            armLabel={armLabel}
            progressFraction={progressFraction}
            onTogglePause={togglePause}
            onEnd={resetWorkout}
          />
        )}

        {screen === "complete" && (
          <CompleteScreen
            config={config}
            totalWorkoutSeconds={totalWorkoutSeconds}
            onReset={resetWorkout}
          />
        )}
      </div>
    </div>
  );
}

function SetupScreen({
  config,
  setConfig,
  totalWorkoutSeconds,
  onStart,
}: {
  config: WorkoutConfig;
  setConfig: React.Dispatch<React.SetStateAction<WorkoutConfig>>;
  totalWorkoutSeconds: number;
  onStart: () => void;
}) {
  const [customRounds, setCustomRounds] = useState("");
  const [customRoundsError, setCustomRoundsError] = useState("");

  const handleCustomRoundsChange = (value: string) => {
    const digits = value.replace(DIGIT_REGEX, "");
    setCustomRounds(digits);
    if (customRoundsError) {
      setCustomRoundsError("");
    }

    const parsed = Number.parseInt(digits, 10);
    if (
      digits &&
      Number.isInteger(parsed) &&
      parsed >= MIN_CUSTOM_ROUNDS &&
      parsed <= MAX_CUSTOM_ROUNDS
    ) {
      setConfig((c) => ({ ...c, rounds: parsed }));
    }
  };

  const validateCustomRounds = () => {
    const parsed = Number.parseInt(customRounds, 10);
    if (!customRounds) {
      setCustomRoundsError("Enter a whole number");
      return false;
    }
    if (
      !Number.isInteger(parsed) ||
      parsed < MIN_CUSTOM_ROUNDS ||
      parsed > MAX_CUSTOM_ROUNDS
    ) {
      setCustomRoundsError(
        `Enter a whole number between ${MIN_CUSTOM_ROUNDS} and ${MAX_CUSTOM_ROUNDS}`,
      );
      return false;
    }
    return true;
  };

  const handleCustomRoundsKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (validateCustomRounds()) {
        setConfig((c) => ({
          ...c,
          rounds: Number.parseInt(customRounds, 10),
        }));
      }
    }
  };

  return (
    <div>
      <h1 className="title">
        Armor Building
        <br />
        Complex EMOM
      </h1>
      <p className="subtitle">
        Every minute on the minute. Set your kettlebell and your rounds — then
        get to work.
      </p>

      <div className="complex-line">
        {config.mode === "double" ? (
          <>
            <div className="complex-card">
              <span>2</span>
              Double Cleans
            </div>
            <div className="complex-card">
              <span>1 </span>
              Double Press
            </div>
            <div className="complex-card">
              <span>3</span>
              Double Front Squats
            </div>
          </>
        ) : (
          <div className="complex-grid">
            <div className="complex-card side-card">
              <div className="side-label">Right side first</div>
              <div>1 x Left Clean & Press</div>
              <div>1 x Right Clean & Press</div>
              <div>2 x Right Front Squats</div>
            </div>
            <div className="complex-card side-card">
              <div className="side-label">Left side first</div>
              <div>1 x Right Clean & Press</div>
              <div>1 x Left Clean & Press</div>
              <div>2 x Left Front Squats</div>
            </div>
          </div>
        )}
      </div>

      <p className="subtitle" style={{ marginBottom: 22 }}>
        {config.mode === "double"
          ? "One round = 2 double cleans, 1 double press, and 3 double front squats."
          : "One round alternates which side squats first: Right side first on odd rounds, Left side first on even rounds."}
      </p>

      <div className="field-row">
        <p className="section-label">How many kettlebells?</p>
        <div className="segmented" role="group" aria-label="Kettlebell mode">
          <button
            type="button"
            className={config.mode === "single" ? "active" : ""}
            aria-pressed={config.mode === "single"}
            onClick={() => setConfig((c) => ({ ...c, mode: "single" }))}
          >
            Single
          </button>
          <button
            type="button"
            className={config.mode === "double" ? "active" : ""}
            aria-pressed={config.mode === "double"}
            onClick={() => setConfig((c) => ({ ...c, mode: "double" }))}
          >
            Double
          </button>
        </div>
      </div>

      <div className="field-row">
        <div className="field-row-head">
          <p className="section-label" style={{ margin: 0 }}>
            Interval
          </p>
          <span className="field-value">60s / round</span>
        </div>
      </div>

      <div className="field-row">
        <div className="field-row-head">
          <p className="section-label" style={{ margin: 0 }}>
            Rounds
          </p>
          <span className="field-value">{config.rounds}</span>
        </div>
        <div className="preset-row">
          {ROUNDS_PRESETS.map((r) => (
            <button
              type="button"
              key={r}
              className={config.rounds === r ? "active" : ""}
              aria-pressed={config.rounds === r}
              onClick={() => {
                setConfig((c) => ({ ...c, rounds: r }));
                setCustomRounds("");
                setCustomRoundsError("");
              }}
            >
              {r}
            </button>
          ))}
          <div className="custom-round-input-container">
            <label htmlFor="custom-rounds" className="sr-only">
              Custom rounds
            </label>
            <input
              id="custom-rounds"
              name="custom-rounds"
              type="number"
              inputMode="numeric"
              min={MIN_CUSTOM_ROUNDS}
              max={MAX_CUSTOM_ROUNDS}
              placeholder="Custom"
              className="custom-round-input"
              value={customRounds}
              onChange={(event) => handleCustomRoundsChange(event.target.value)}
              onKeyDown={handleCustomRoundsKeyDown}
              aria-invalid={Boolean(customRoundsError)}
              aria-describedby={
                customRoundsError ? "custom-rounds-error" : undefined
              }
              maxLength={2}
              autoComplete="off"
            />
          </div>
        </div>
        {customRoundsError ? (
          <div id="custom-rounds-error" className="custom-round-error">
            {customRoundsError}
          </div>
        ) : null}
      </div>

      <p className="totals">
        Total time: <span>{formatClock(totalWorkoutSeconds)}</span>
      </p>

      <button type="button" className="start-btn" onClick={onStart}>
        Start Workout
      </button>
    </div>
  );
}

function RunningScreen({
  config,
  round,
  secondsLeft,
  isPaused,
  armLabel,
  progressFraction,
  onTogglePause,
  onEnd,
}: {
  config: WorkoutConfig;
  round: number;
  secondsLeft: number;
  isPaused: boolean;
  armLabel: string | null;
  progressFraction: number;
  onTogglePause: () => void;
  onEnd: () => void;
}) {
  const radius = 138;
  const bezelRadius = 148;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progressFraction);
  const isUrgent = secondsLeft <= 3 && secondsLeft > 0;

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = (i / TICK_COUNT) * 2 * Math.PI;
        const outer = bezelRadius - 4;
        const inner = outer - 10;
        const cx = 150;
        const cy = 150;
        return {
          x1: cx + inner * Math.cos(angle),
          y1: cy + inner * Math.sin(angle),
          x2: cx + outer * Math.cos(angle),
          y2: cy + outer * Math.sin(angle),
        };
      }),
    [],
  );

  return (
    <div className="run-wrap">
      <p className="run-eyebrow">
        {config.mode === "single" ? "Single Kettlebell" : "Double Kettlebell"}
      </p>
      <p className="round-indicator">
        Round <span>{round}</span> / {config.rounds}
      </p>

      <div className="dial-wrap">
        <div className="dial-plate" />
        <svg
          className="dial-svg"
          width="300"
          height="300"
          viewBox="0 0 300 300"
        >
          <circle className="dial-bezel" cx="150" cy="150" r={bezelRadius} />
          {ticks.map((t, i) => (
            <line
              key={i}
              className="tick"
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
            />
          ))}
          <circle className="dial-track" cx="150" cy="150" r={radius} />
          <circle
            className={`dial-progress ${isUrgent ? "urgent" : ""}`}
            cx="150"
            cy="150"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="dial-center">
          <div
            className={`big-time ${isUrgent ? "urgent" : ""}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {formatClock(secondsLeft)}
          </div>
          {armLabel && <div className="arm-badge">{armLabel}</div>}
        </div>
      </div>

      {config.mode === "double" ? (
        <p className="reps-reminder">
          <b>2</b> Double Cleans&nbsp; · &nbsp;<b>1&nbsp;</b> Double Press&nbsp;
          · &nbsp;<b>3</b> Double Front Squats
        </p>
      ) : (
        <div className="reps-reminder" style={{ display: "grid", gap: "6px" }}>
          <span>
            <b>L</b> Clean & Press · <b>R</b> Clean & Press · <b>2</b> Right
            Front Squats
          </span>
          <span>
            <b>R</b> Clean & Press · <b>L</b> Clean & Press · <b>2</b> Left
            Front Squats
          </span>
          <span>Alternate which side squats first each round.</span>
        </div>
      )}

      <div className="run-controls">
        <button type="button" onClick={onTogglePause}>
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button type="button" className="end" onClick={onEnd}>
          End Workout
        </button>
      </div>
    </div>
  );
}

function CompleteScreen({
  config,
  totalWorkoutSeconds,
  onReset,
}: {
  config: WorkoutConfig;
  totalWorkoutSeconds: number;
  onReset: () => void;
}) {
  return (
    <div className="complete-wrap">
      <p className="complete-eyebrow">Workout Complete</p>
      <h1 className="complete-title">Rack the Bells</h1>

      <div className="complete-stats">
        <div>
          <div className="complete-stat-value">{config.rounds}</div>
          <div className="complete-stat-label">Rounds</div>
        </div>
        <div>
          <div className="complete-stat-value">
            {formatClock(totalWorkoutSeconds)}
          </div>
          <div className="complete-stat-label">Total Time</div>
        </div>
        <div>
          <div className="complete-stat-value">
            {config.mode === "single" ? "1x" : "2x"}
          </div>
          <div className="complete-stat-label">Kettlebell</div>
        </div>
      </div>

      <button type="button" className="start-btn" onClick={onReset}>
        Set Up Another
      </button>
    </div>
  );
}
