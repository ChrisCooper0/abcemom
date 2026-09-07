import { useState } from "react";
import { TimerDial } from "./TimerDial";

type KettlebellMode = "single" | "double";

export type WorkoutConfig = {
  mode: KettlebellMode;
  rounds: number;
};

const ROUNDS_PRESETS = [5, 6, 8, 10, 15, 20];
const MIN_CUSTOM_ROUNDS = 1;
const MAX_CUSTOM_ROUNDS = 90;
const DIGIT_REGEX = /\D/g;

export function SetupScreen({
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
      setConfig((current) => ({ ...current, rounds: parsed }));
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
        setConfig((current) => ({
          ...current,
          rounds: Number.parseInt(customRounds, 10),
        }));
      }
    }
  };

  return (
    <div className="setup-wrap">
      <div className="setup-intro">
        <h1 className="title">
          ABC
          <br />
          EMOM
        </h1>
        <p className="subtitle">
          Every minute on the minute. Set your kettlebell and your rounds — then
          get to work.
        </p>
      </div>

      <div className="complex-line workout-plan">
        {config.mode === "double" ? (
          <>
            <div className="complex-card">
              <span>2</span>
              Cleans
            </div>
            <div className="complex-card">
              <span>1 </span>
              Press
            </div>
            <div className="complex-card">
              <span>3</span>
              Squats
            </div>
          </>
        ) : (
          <div className="complex-card side-card">
            <div>1 x Left Clean & Press</div>
            <div>1 x Right Clean & Press</div>
            <div>2 x Right Front Squats</div>
            <br></br>
            <div>1 x Right Clean & Press</div>
            <div>1 x Left Clean & Press</div>
            <div>2 x Left Front Squats</div>
          </div>
        )}
      </div>

      <p className="subtitle setup-note">
        {config.mode === "double"
          ? "One round = 2 cleans, 1 press, and 3 squats."
          : "One round = left clean & press, right clean & press, 2 right front squats, right clean & press, left clean & press, and 2 left front squats."}
      </p>

      <div className="field-row setting-row">
        <p className="section-label">How many kettlebells?</p>
        <div className="segmented" role="group" aria-label="Kettlebell mode">
          <button
            type="button"
            className={config.mode === "single" ? "active" : ""}
            aria-pressed={config.mode === "single"}
            onClick={() =>
              setConfig((current) => ({ ...current, mode: "single" }))
            }
          >
            Single
          </button>
          <button
            type="button"
            className={config.mode === "double" ? "active" : ""}
            aria-pressed={config.mode === "double"}
            onClick={() =>
              setConfig((current) => ({ ...current, mode: "double" }))
            }
          >
            Double
          </button>
        </div>
      </div>

      <div className="field-row setting-row setting-row-static">
        <div className="field-row-head">
          <p className="section-label">Interval</p>
          <span className="field-value">60s / round</span>
        </div>
      </div>

      <div className="field-row setting-row">
        <div className="field-row-head">
          <p className="section-label">Rounds</p>
          <span className="field-value">{config.rounds}</span>
        </div>
        <div className="preset-row">
          {ROUNDS_PRESETS.map((rounds) => (
            <button
              type="button"
              key={rounds}
              className={config.rounds === rounds ? "active" : ""}
              aria-pressed={config.rounds === rounds}
              onClick={() => {
                setConfig((current) => ({ ...current, rounds }));
                setCustomRounds("");
                setCustomRoundsError("");
              }}
            >
              {rounds}
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

      <p className="setup-footer">
        Made with ❤️ by{" "}
        <a
          className="setup-footer"
          target="_blank"
          href="https://github.com/ChrisCooper0/abcemom"
        >
          Cooper
        </a>
      </p>
    </div>
  );
}

export function RunningScreen({
  config,
  round,
  secondsLeft,
  isPaused,
  armLabel,
  progressFraction,
  onTogglePause,
  onEnd,
  countdownLabel,
}: {
  config: WorkoutConfig;
  round: number;
  secondsLeft: number;
  isPaused: boolean;
  armLabel: string | null;
  progressFraction: number;
  onTogglePause: () => void;
  onEnd: () => void;
  countdownLabel?: string;
}) {
  return (
    <div className={`run-wrap ${isPaused ? "is-paused" : ""}`}>
      <div className="run-header">
        <p className="run-eyebrow">
          {countdownLabel
            ? countdownLabel
            : config.mode === "single"
              ? "Single Kettlebell"
              : "Double Kettlebell"}
        </p>
        <p className="round-indicator">
          Round <span>{round}</span> / {config.rounds}
        </p>
      </div>

      <TimerDial
        secondsLeft={secondsLeft}
        progressFraction={progressFraction}
        armLabel={armLabel}
      />

      {config.mode === "double" ? (
        <p className="reps-reminder">
          <b>2</b> Cleans&nbsp; · &nbsp;<b>1&nbsp;</b> Press&nbsp; · &nbsp;
          <b>3</b> Squats
        </p>
      ) : (
        <div className="reps-reminder reps-grid">
          <span>
            <>
              <b>L</b> Clean & Press · <b>R</b> Clean & Press · <b>2</b> R Front
              Squats · <b>R</b> Clean & Press · <b>L</b> Clean & Press ·{" "}
              <b>2</b> L Front Squats
            </>
          </span>
        </div>
      )}

      <div className="run-controls" aria-label="Workout controls">
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

export function CompleteScreen({
  config,
  totalWorkoutSeconds,
  completedRounds,
  onReset,
}: {
  config: WorkoutConfig;
  totalWorkoutSeconds: number;
  completedRounds?: number;
  onReset: () => void;
}) {
  const roundsToShow = completedRounds ?? config.rounds;

  return (
    <div className="complete-wrap">
      <div className="complete-mark" aria-hidden="true">
        ✓
      </div>
      <p className="complete-eyebrow">Workout Complete</p>
      <h1 className="complete-title">Rack the Bells</h1>

      <div className="complete-stats" aria-label="Workout summary">
        <div>
          <div className="complete-stat-value">{roundsToShow}</div>
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

function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
