import {
  Gauge,
  Mountain,
  ArrowUp,
  Compass,
  Pause,
  Play,
  RotateCcw,
  Video,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

function Instrument({ Icon, label, value, unit, children, positive = false }) {
  return (
    <div className={`instrument ${positive ? "positive" : ""}`}>
      <span className="instrument-label">
        <Icon size={13} />
        {label}
      </span>
      <div className="instrument-value">
        {value}
        <span>{unit}</span>
      </div>
      {children}
    </div>
  );
}
export default function Instruments({ sim }) {
  const state = sim.snapshot,
    heading = Math.round((state.heading * 180) / Math.PI) % 360;
  const compass = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
    Math.round(heading / 45) % 8
  ];
  return (
    <div className="instrument-area">
      <div className="keyboard-hints">
        <span>
          <kbd>←</kbd>
          <kbd>→</kbd> Bank
        </span>
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> Pitch
        </span>
        <span>
          <kbd className="space-key">space</kbd> Pause
        </span>
        <button onClick={() => sim.openModal("help")}>
          All controls <span>↗</span>
        </button>
      </div>
      <section
        className="instrument-panel glass"
        aria-label="Flight instruments"
      >
        <Instrument
          Icon={Gauge}
          label="Airspeed"
          value={Math.round(state.speed * 3.6)}
          unit="km/h"
        >
          <div className="speed-ticks">
            {Array.from({ length: 20 }, (_, i) => (
              <i
                className={i < (state.speed * 3.6 - 40) / 5 ? "active" : ""}
                key={i}
              />
            ))}
          </div>
        </Instrument>
        <Instrument
          Icon={Mountain}
          label="Altitude"
          value={Math.round(state.altitude).toLocaleString()}
          unit="m"
        >
          <div className="instrument-caption">above sea level</div>
        </Instrument>
        <Instrument
          Icon={ArrowUp}
          label="Vertical speed"
          value={`${state.verticalSpeed >= 0 ? "+" : "−"}${Math.abs(state.verticalSpeed).toFixed(1)}`}
          unit="m/s"
          positive={state.verticalSpeed > 0}
        >
          <div className="vario-track">
            <i
              style={{
                left: `${Math.max(3, Math.min(97, 50 + state.verticalSpeed * 7))}%`,
              }}
            />
            <span />
          </div>
        </Instrument>
        <Instrument
          Icon={Compass}
          label="Heading"
          value={`${heading.toString().padStart(3, "0")}°`}
          unit={compass}
        >
          <div className="heading-scale">
            <span>{(heading + 330) % 360}</span>
            <i />
            <i />
            <b>{compass}</b>
            <i />
            <i />
            <span>{(heading + 30) % 360}</span>
          </div>
        </Instrument>
        <div className="instrument-actions">
          <button
            className="pause-button"
            onClick={(event) => {
              sim.pause();
              event.currentTarget.blur();
            }}
            aria-label={
              state.status === "flying" ? "Pause flight" : "Resume flight"
            }
            title="Pause / resume (Space)"
            disabled={["landed", "boundary"].includes(state.status)}
          >
            {state.status === "flying" ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" />
            )}
          </button>
          <div>
            <button
              className="icon-button"
              onClick={(event) => {
                sim.restart();
                event.currentTarget.blur();
              }}
              aria-label="Restart flight"
              title="Restart (R)"
            >
              <RotateCcw size={15} />
            </button>
            <button
              className={`icon-button ${sim.camera === "cockpit" ? "active" : ""}`}
              onClick={(event) => {
                sim.switchCamera();
                event.currentTarget.blur();
              }}
              aria-label={
                sim.camera === "chase"
                  ? "Switch to cockpit camera"
                  : "Switch to chase camera"
              }
              title="Switch camera (C)"
            >
              <Video size={16} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function TouchControls({ input }) {
  const button = (direction, Icon) => (
    <button
      className={`touch-key touch-${direction}`}
      aria-label={
        direction === "left" || direction === "right"
          ? `Bank ${direction}`
          : direction === "up"
            ? "Push nose down"
            : "Pull nose up"
      }
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        input.current[direction] = true;
      }}
      onPointerUp={() => {
        input.current[direction] = false;
      }}
      onPointerCancel={() => {
        input.current[direction] = false;
      }}
      onLostPointerCapture={() => {
        input.current[direction] = false;
      }}
    >
      <Icon size={22} />
    </button>
  );
  return (
    <div className="touch-controls">
      <div>
        {button("left", ArrowLeft)}
        {button("right", ArrowRight)}
      </div>
      <div>
        {button("up", ArrowUp)}
        {button("down", ArrowDown)}
      </div>
    </div>
  );
}
