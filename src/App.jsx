import { useState } from "react";
import {
  MapPin,
  Volume2,
  VolumeX,
  CircleHelp,
  ArrowUpRight,
  Wind,
  ArrowUp,
  Eye,
  CloudSun,
  Pause,
  RotateCcw,
  Bot,
  FastForward,
} from "lucide-react";
import { useFlight } from "./hooks/useFlight";
import { useFlightAudio } from "./hooks/useFlightAudio";
import FlightScene from "./components/FlightScene";
import Conditions from "./components/Conditions";
import FlightMap from "./components/FlightMap";
import Instruments, { TouchControls } from "./components/Instruments";
import FlightModal from "./components/FlightModal";
import GliderPicker from "./components/GliderPicker";
import { gliderSpec } from "./sim/gliders";
import { formatTime, WEATHER, terrainHeight, THERMALS } from "./sim/physics";

function GliderMark({ small = false }) {
  return (
    <svg
      width={small ? 23 : 34}
      height={small ? 23 : 34}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m3 22 17-4 17 4M20 8v25m-6-2 6-2 6 2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const sim = useFlight(),
    state = sim.snapshot;
  const [sound, setSound] = useState(false);
  useFlightAudio(sound, state);
  const weather = WEATHER[sim.settings.weather];
  const glider = gliderSpec(sim.settings.glider);
  const terminal = ["landed", "boundary"].includes(state.status);
  const clearance = state.altitude - terrainHeight(state.x, state.z);
  const nearestThermal = Math.min(...THERMALS.map((t) => Math.hypot(state.x - t.x, state.z - t.z)));
  return (
    <div className="app-shell">
      <header className="app-header">
        <a
          href="#"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            if (sim.modal) sim.closeModal();
          }}
          aria-label="Glide flight deck"
        >
          <GliderMark />
          <span>
            glide<span className="brand-dot">.</span>
          </span>
        </a>
        <div className="brand-divider" />
        <span className="brand-description">A little closer to the sky.</span>
        <nav className="main-nav" aria-label="Main navigation">
          <button
            className={!sim.modal || sim.modal !== "log" ? "active" : ""}
            onClick={() => {
              if (sim.modal) sim.closeModal();
            }}
          >
            Flight deck
          </button>
          <button
            className={sim.modal === "log" ? "active" : ""}
            onClick={() => {
              if (sim.modal !== "log") sim.openModal("log");
            }}
          >
            Flight log <ArrowUpRight size={13} />
          </button>
        </nav>
        <div className="header-right">
          <span className="location">
            <MapPin size={14} /> Julian Alps, Slovenia
          </span>
          <span className="header-divider" />
          <button
            className={`icon-button ${sound ? "active" : ""}`}
            aria-label={sound ? "Mute sound" : "Enable sound"}
            aria-pressed={sound}
            onClick={(event) => {
              setSound(!sound);
              event.currentTarget.blur();
            }}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className="icon-button"
            aria-label="Flight controls and help"
            onClick={() => sim.openModal("help")}
          >
            <CircleHelp size={18} />
          </button>
        </div>
      </header>

      <main className={`flight-deck weather-${sim.settings.weather}`}>
        <FlightScene sim={sim} />
        <div className="scene-vignette" />
        <div className="scene-top-shade" />
        <section className={`flight-intro ${state.status !== "ready" ? "is-flying" : ""}`}>
          {state.status === "ready" ? (
            <>
              <h1>Find your lift.</h1>
              <p>
                No engine. No rush.
                <br />
                Just you, the wind, and a little instinct.
              </p>
              <button
                className="primary-button start-button"
                onClick={(event) => {
                  sim.start();
                  event.currentTarget.blur();
                }}
              >
                Start flying <ArrowUpRight size={19} />
              </button>
              <span className="intro-note">Your sky. Your pace.</span>
            </>
          ) : (
            <>
              <div className="region-label">
                <span className={state.status === "flying" ? "live" : ""} />{" "}
                {state.status === "paused"
                  ? "TAKING A BREATHER"
                  : terminal
                    ? "FLIGHT COMPLETE"
                    : "FREE FLIGHT"}
              </div>
              <h1>Julian Alps.</h1>
              <p>
                {state.lift > 0.8
                  ? "You found rising air. Circle to climb."
                  : "Follow the valley. Find your next thermal."}
              </p>
            </>
          )}
        </section>
        <Conditions settings={sim.settings} setSettings={sim.setSettings} />

        <div className="scene-compass" aria-hidden="true">
          <span>
            {Math.round(((state.heading * 180) / Math.PI + 330) % 360)
              .toString()
              .padStart(3, "0")}
          </span>
          <i />
          <i />
          <b>
            {
              ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][
                Math.round((state.heading * 4) / Math.PI) % 8
              ]
            }
          </b>
          <i />
          <i />
          <span>
            {Math.round(((state.heading * 180) / Math.PI + 30) % 360)
              .toString()
              .padStart(3, "0")}
          </span>
          <div />
        </div>

        {sim.settings.thermals && !terminal && state.status !== "ready" && (
          <div className={`thermal-indicator ${state.lift > 0.8 ? "in-thermal" : ""}`}>
            <span className="thermal-symbol">
              <ArrowUp size={17} />
              <i />
              <i />
            </span>
            <div>
              <strong>{state.lift > 0.8 ? "Rising air" : "Lift is out there"}</strong>
              <span>
                {state.lift > 0.8
                  ? `+${state.lift.toFixed(1)} m/s thermal`
                  : `Nearest thermal · ${(nearestThermal / 1000).toFixed(1)} km`}
              </span>
            </div>
          </div>
        )}

        {state.status === "paused" && !sim.modal && (
          <div className="pause-overlay">
            <div className="pause-symbol">
              <Pause size={21} />
            </div>
            <h2>A moment of stillness.</h2>
            <p>Your flight is paused.</p>
            <button
              className="primary-button"
              onClick={(event) => {
                sim.pause();
                event.currentTarget.blur();
              }}
            >
              Keep flying <ArrowUpRight size={17} />
            </button>
          </div>
        )}
        {terminal && (
          <div className="pause-overlay end-overlay">
            <span className="modal-icon">
              <GliderMark />
            </span>
            <h2>{state.status === "boundary" ? "A whole sky behind you." : "Back to earth."}</h2>
            <p>
              {state.status === "boundary"
                ? "You reached the edge of this alpine playground."
                : "Your glider has reached the terrain. Every flight teaches you something."}
            </p>
            <div className="end-stats">
              <span>{formatTime(state.time)} in the air</span>
              <span>{(state.distance / 1000).toFixed(2)} km explored</span>
            </div>
            <button className="primary-button" onClick={sim.restart}>
              Fly again <RotateCcw size={17} />
            </button>
            <button className="text-button" onClick={() => sim.openModal("log")}>
              View flight log
            </button>
          </div>
        )}
        {state.status === "flying" && (state.stalled || clearance < 140) && (
          <div className="flight-warning" role="alert">
            {state.stalled
              ? "Low airspeed — push the nose down"
              : "Terrain ahead — gain altitude or turn away"}
          </div>
        )}

        {state.status === "ready" && (
          <GliderPicker
            value={glider.id}
            onChange={(id) => sim.setSettings((value) => ({ ...value, glider: id }))}
          />
        )}
        <div className={`bottom-layout ${state.status === "ready" ? "is-hidden" : ""}`}>
          <FlightMap
            state={state}
            thermals={sim.settings.thermals}
            onExpand={() => sim.openModal("map")}
          />
          <Instruments sim={sim} />
          <div className="flight-aside">
            <div>
              <CloudSun size={17} />
              <span>
                {weather.visibility}
                <small>visibility</small>
              </span>
            </div>
            <div>
              <Wind size={17} />
              <span>
                {sim.settings.wind} km/h<small>from the northwest</small>
              </span>
            </div>
          </div>
        </div>
        <TouchControls input={sim.input} />
        {sim.camera === "cockpit" && (
          <div className="cockpit-reticle" aria-hidden="true">
            <span />
            <i />
            <span />
          </div>
        )}
      </main>

      <footer className="status-bar">
        <div className="aircraft-label">
          <GliderMark small />
          <strong>{glider.name}</strong>
          <span>{glider.span} m wingspan</span>
        </div>
        <div className="flight-status">
          <span className={`status-dot ${state.status === "paused" ? "amber" : ""}`} />
          <span>
            {state.status === "ready"
              ? "Ready for takeoff"
              : state.status === "flying"
                ? sim.autopilot
                  ? sim.pilot.current.mode === "climb"
                    ? "AI pilot · circling in a thermal"
                    : "AI pilot · gliding to the next thermal"
                  : "In flight"
                : state.status === "paused"
                  ? "Paused"
                  : "Flight complete"}
          </span>
          <i />
          <time>{formatTime(state.time)}</time>
          <i />
          <span>{(state.distance / 1000).toFixed(1)} km</span>
        </div>
        <div className="footer-toggles">
          <div className="time-scale">
            <label htmlFor="time-scale">
              <FastForward size={14} /> Speed
            </label>
            <input
              id="time-scale"
              type="range"
              min="1"
              max="8"
              step="1"
              value={sim.settings.timeScale}
              aria-valuetext={`${sim.settings.timeScale} times real time`}
              style={{
                "--range-progress": `${((sim.settings.timeScale - 1) / 7) * 100}%`,
              }}
              onChange={(event) =>
                sim.setSettings((value) => ({
                  ...value,
                  timeScale: Number(event.target.value),
                }))
              }
              onPointerUp={(event) => event.currentTarget.blur()}
            />
            <output htmlFor="time-scale">{sim.settings.timeScale}×</output>
          </div>
          <button
            className={`thermal-toggle ${sim.autopilot ? "on" : ""}`}
            onClick={(event) => {
              sim.toggleAutopilot();
              event.currentTarget.blur();
            }}
            aria-pressed={sim.autopilot}
            title="Let the AI fly (P). Steer to take over."
            disabled={terminal}
          >
            <Bot size={14} />
            <span>AI pilot</span>
            <span className="toggle-track">
              <i />
            </span>
          </button>
          <button
            className={`thermal-toggle ${sim.settings.thermals ? "on" : ""}`}
            onClick={(event) => {
              sim.toggleThermals();
              event.currentTarget.blur();
            }}
            aria-pressed={sim.settings.thermals}
          >
            <Eye size={14} />
            <span>Show thermals</span>
            <span className="toggle-track">
              <i />
            </span>
          </button>
        </div>
      </footer>
      {sim.modal && <FlightModal sim={sim} />}
    </div>
  );
}
