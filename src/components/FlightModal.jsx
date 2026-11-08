import { useEffect, useRef } from "react";
import {
  X,
  ArrowUpRight,
  Wind,
  ArrowUp,
  Compass,
  Clock,
  Mountain,
  Route,
} from "lucide-react";
import { formatTime, WEATHER } from "../sim/physics";
import FlightMap from "./FlightMap";

export default function FlightModal({ sim }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.querySelector("button")?.focus();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        sim.closeModal();
      }
      if (event.key === "Tab") {
        const focusable = dialog.current.querySelectorAll(
          'button, [tabindex="0"]',
        );
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keydown);
    return () => {
      document.removeEventListener("keydown", keydown);
      previous?.focus();
    };
  }, [sim.closeModal]);
  const state = sim.snapshot;
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) sim.closeModal();
      }}
    >
      <section
        className={`flight-modal ${sim.modal === "map" ? "map-modal" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialog}
      >
        <button
          className="icon-button modal-close"
          onClick={sim.closeModal}
          aria-label="Close dialog"
        >
          <X size={21} />
        </button>
        {sim.modal === "help" && (
          <>
            <span className="modal-icon">
              <Compass size={25} />
            </span>
            <h2 id="modal-title">A feel for the air.</h2>
            <p>
              There’s no engine here. Trade altitude for speed, then find rising
              air to climb again.
            </p>
            <div className="control-table">
              <div>
                <span>
                  <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>
                </span>
                <strong>Bank left / right</strong>
              </div>
              <div>
                <span>
                  <kbd>↑</kbd> <kbd>↓</kbd> or <kbd>W</kbd> <kbd>S</kbd>
                </span>
                <strong>Nose down / up</strong>
              </div>
              <div>
                <kbd>space</kbd>
                <strong>Pause / resume</strong>
              </div>
              <div>
                <span>
                  <kbd>C</kbd> / <kbd>T</kbd> / <kbd>R</kbd>
                </span>
                <strong>Camera / thermals / restart</strong>
              </div>
            </div>
            <div className="flying-tip">
              <ArrowUp size={20} />
              <div>
                <strong>Circle to climb.</strong>
                <p>
                  Pale green particles mark thermals. Fly into a column and hold
                  a gentle bank to stay in the rising air. Watch the vertical
                  speed turn positive.
                </p>
              </div>
            </div>
            <button className="primary-button" onClick={sim.closeModal}>
              Got it. Let’s fly <ArrowUpRight size={17} />
            </button>
          </>
        )}
        {sim.modal === "log" && (
          <>
            <span className="modal-icon">
              <Route size={25} />
            </span>
            <h2 id="modal-title">Your time in the sky.</h2>
            <p>Julian Alps · {WEATHER[sim.settings.weather].label} · LS8-18</p>
            <div className="log-stats">
              {[
                {
                  Icon: Clock,
                  label: "Flight time",
                  value: formatTime(state.time),
                },
                {
                  Icon: Route,
                  label: "Distance",
                  value: `${(state.distance / 1000).toFixed(2)} km`,
                },
                {
                  Icon: Mountain,
                  label: "Highest altitude",
                  value: `${Math.round(state.maxAltitude).toLocaleString()} m`,
                },
                {
                  Icon: Wind,
                  label: "Best climb",
                  value: `+${state.maxLift.toFixed(1)} m/s`,
                },
              ].map(({ Icon, label, value }) => (
                <div key={label}>
                  <Icon size={19} />
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="log-thermal">
              <span>Time in rising air</span>
              <strong>{formatTime(state.thermalTime)}</strong>
            </div>
            <p className="log-note">
              {state.time === 0
                ? "Every good flight starts with a little curiosity. Your flight log will fill as you explore."
                : "A little altitude, a little adventure. This log follows your current flight and resets when you start again."}
            </p>
            <button className="primary-button" onClick={sim.closeModal}>
              Back to the flight deck <ArrowUpRight size={17} />
            </button>
          </>
        )}
        {sim.modal === "map" && (
          <>
            <h2 id="modal-title">Room to roam.</h2>
            <p>Your flight path through the Julian Alps.</p>
            <FlightMap
              state={state}
              thermals={sim.settings.thermals}
              expanded
            />
            <div className="map-modal-note">
              <span className="status-dot" /> Pale green rings mark rising air.
              Your trail shows where you’ve been.
            </div>
          </>
        )}
      </section>
    </div>
  );
}
