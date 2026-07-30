"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useBeeper from "./hooks/useBeeper";
import useWakeLock from "./hooks/useWakeLock";
import {
  CompleteScreen,
  RunningScreen,
  SetupScreen,
  type WorkoutConfig,
} from "./components/WorkoutScreens";
import "./page.css";

const EMOM_INTERVAL_SECONDS = 60;
const COUNTDOWN_SECONDS = 3;
const DEFAULT_CONFIG: WorkoutConfig = {
  mode: "double",
  rounds: 10,
};

export default function Page() {
  const [config, setConfig] = useState<WorkoutConfig>(DEFAULT_CONFIG);
  const [screen, setScreen] = useState<
    "setup" | "countdown" | "running" | "complete"
  >("setup");
  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(EMOM_INTERVAL_SECONDS);
  const [countdownSeconds, setCountdownSeconds] = useState(COUNTDOWN_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [finishedRounds, setFinishedRounds] = useState<number | null>(null);
  const [finishedSeconds, setFinishedSeconds] = useState<number | null>(null);

  const endTimeRef = useRef<number>(0);
  const countdownEndRef = useRef<number>(0);
  const lastBeepMarkRef = useRef<number>(-1);
  const lastCountdownMarkRef = useRef<number>(-1);
  const beep = useBeeper();
  const totalWorkoutSeconds = config.rounds * EMOM_INTERVAL_SECONDS;

  useWakeLock((screen === "running" || screen === "countdown") && !isPaused);

  const startWorkout = useCallback(() => {
    setRound(1);
    setCountdownSeconds(COUNTDOWN_SECONDS);
    countdownEndRef.current = Date.now() + COUNTDOWN_SECONDS * 1000;
    lastCountdownMarkRef.current = -1;
    setIsPaused(false);
    setScreen("countdown");
    beep(520, 90, 0.045);
  }, [beep]);

  const finishWorkout = useCallback(
    (completedRounds: number, elapsedSeconds: number) => {
      setFinishedRounds(completedRounds);
      setFinishedSeconds(elapsedSeconds);
      setIsPaused(false);
      setScreen("complete");
    },
    [],
  );

  const resetWorkout = useCallback(() => {
    setScreen("setup");
    setRound(1);
    setSecondsLeft(EMOM_INTERVAL_SECONDS);
    setCountdownSeconds(COUNTDOWN_SECONDS);
    setIsPaused(false);
    setFinishedRounds(null);
    setFinishedSeconds(null);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => {
      const next = !prev;
      if (next) {
        setSecondsLeft(Math.max(0, (endTimeRef.current - Date.now()) / 1000));
      } else {
        endTimeRef.current = Date.now() + secondsLeft * 1000;
      }
      return next;
    });
  }, [secondsLeft]);

  useEffect(() => {
    if (screen !== "running" || isPaused) return;

    const tick = () => {
      const remainingMs = endTimeRef.current - Date.now();
      const remaining = remainingMs / 1000;

      if (remaining <= 0) {
        if (round >= config.rounds) {
          setSecondsLeft(0);
          finishWorkout(config.rounds, totalWorkoutSeconds);
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
  }, [beep, config.rounds, isPaused, round, screen]);

  useEffect(() => {
    if (screen !== "countdown") return;

    const tick = () => {
      const remainingMs = countdownEndRef.current - Date.now();
      const remaining = remainingMs / 1000;

      if (remaining <= 0) {
        setSecondsLeft(EMOM_INTERVAL_SECONDS);
        endTimeRef.current = Date.now() + EMOM_INTERVAL_SECONDS * 1000;
        lastBeepMarkRef.current = -1;
        setScreen("running");
        beep(660, 150, 0.06);
        return;
      }

      setCountdownSeconds(remaining);

      const wholeSecondsLeft = Math.ceil(remaining);
      if (
        wholeSecondsLeft >= 1 &&
        lastCountdownMarkRef.current !== wholeSecondsLeft
      ) {
        lastCountdownMarkRef.current = wholeSecondsLeft;
        beep(520, 90, 0.045);
      }
    };

    const id = window.setInterval(tick, 100);
    return () => window.clearInterval(id);
  }, [beep, screen]);

  const armLabel =
    config.mode === "single"
      ? round % 2 === 1
        ? "Right squats first"
        : "Left squats first"
      : null;

  const displayedSeconds = screen === "countdown" ? countdownSeconds : secondsLeft;
  const progressFraction = Math.min(
    1,
    Math.max(
      0,
      screen === "countdown"
        ? (COUNTDOWN_SECONDS - displayedSeconds) / COUNTDOWN_SECONDS
        : (EMOM_INTERVAL_SECONDS - secondsLeft) / EMOM_INTERVAL_SECONDS,
    ),
  );

  const elapsedSeconds =
    screen === "running"
      ? EMOM_INTERVAL_SECONDS * (round - 1) +
        Math.max(0, EMOM_INTERVAL_SECONDS - secondsLeft)
      : screen === "countdown"
      ? 0
      : totalWorkoutSeconds;

  const handleEndWorkout = useCallback(() => {
    if (screen === "running") {
      const elapsed =
        EMOM_INTERVAL_SECONDS * (round - 1) +
        Math.max(0, EMOM_INTERVAL_SECONDS - secondsLeft);
      finishWorkout(round, elapsed);
      return;
    }

    if (screen === "countdown") {
      finishWorkout(0, 0);
      return;
    }

    resetWorkout();
  }, [finishWorkout, resetWorkout, round, screen, secondsLeft]);

  return (
    <div className="page">
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
            onEnd={handleEndWorkout}
          />
        )}
        {screen === "countdown" && (
          <RunningScreen
            config={config}
            round={round}
            secondsLeft={countdownSeconds}
            isPaused={isPaused}
            armLabel={armLabel}
            progressFraction={progressFraction}
            onTogglePause={togglePause}
            onEnd={handleEndWorkout}
            countdownLabel="Get ready"
          />
        )}

        {screen === "complete" && (
          <CompleteScreen
            config={config}
            totalWorkoutSeconds={finishedSeconds ?? totalWorkoutSeconds}
            completedRounds={finishedRounds ?? config.rounds}
            onReset={resetWorkout}
          />
        )}
      </div>
    </div>
  );
}
