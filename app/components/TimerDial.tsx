import { useMemo } from "react";

type TimerDialProps = {
  secondsLeft: number;
  progressFraction: number;
  armLabel: string | null;
};

const DIAL_RADIUS = 138;
const DIAL_BEZEL_RADIUS = 148;
const DIAL_CENTER = 150;
const TICK_COUNT = 12;

export function TimerDial({
  secondsLeft,
  progressFraction,
  armLabel,
}: TimerDialProps) {
  const circumference = 2 * Math.PI * DIAL_RADIUS;
  const offset =
    circumference * (1 - Math.min(1, Math.max(0, progressFraction)));
  const isUrgent = secondsLeft <= 3 && secondsLeft > 0;

  const ticks = useMemo(
    () =>
      Array.from({ length: TICK_COUNT }, (_, index) => {
        const angle = (index / TICK_COUNT) * 2 * Math.PI;
        const outer = DIAL_BEZEL_RADIUS - 4;
        const inner = outer - 10;
        return {
          x1: DIAL_CENTER + inner * Math.cos(angle),
          y1: DIAL_CENTER + inner * Math.sin(angle),
          x2: DIAL_CENTER + outer * Math.cos(angle),
          y2: DIAL_CENTER + outer * Math.sin(angle),
        };
      }),
    [],
  );

  return (
    <div
      className="dial-wrap"
      role="progressbar"
      aria-label="Round timer"
      aria-valuemin={0}
      aria-valuemax={60}
      aria-valuenow={Math.max(0, Math.round(secondsLeft))}
    >
      <div className="dial-plate" />
      <svg
        className="dial-svg"
        width="300"
        height="300"
        viewBox="0 0 300 300"
        aria-hidden="true"
      >
        <circle
          className="dial-bezel"
          cx="150"
          cy="150"
          r={DIAL_BEZEL_RADIUS}
        />
        {ticks.map((tick, index) => (
          <line
            key={index}
            className="tick"
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
          />
        ))}
        <circle className="dial-track" cx="150" cy="150" r={DIAL_RADIUS} />
        <circle
          className={`dial-progress ${isUrgent ? "urgent" : ""}`}
          cx="150"
          cy="150"
          r={DIAL_RADIUS}
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
  );
}

function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
