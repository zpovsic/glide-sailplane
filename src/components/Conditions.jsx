import { useEffect, useState } from "react";
import {
  Sun,
  Cloud,
  CloudLightning,
  Wind,
  ArrowUpRight,
  ChevronDown,
  SlidersHorizontal,
  ArrowUp,
  CloudSun,
} from "lucide-react";
import { WEATHER } from "../sim/physics";

const presets = [
  { id: "sunny", label: "Sunny", Icon: Sun },
  { id: "cloudy", label: "Cloudy", Icon: Cloud },
  { id: "storm", label: "Storm", Icon: CloudLightning },
];
export default function Conditions({ settings, setSettings }) {
  const [expanded, setExpanded] = useState(() => window.innerWidth > 680);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 680px)");
    const resize = (event) => setExpanded(!event.matches);
    media.addEventListener("change", resize);
    return () => media.removeEventListener("change", resize);
  }, []);
  const weather = WEATHER[settings.weather];
  return (
    <aside
      className={`conditions glass ${expanded ? "is-expanded" : ""}`}
      aria-label="Flight conditions"
    >
      <button
        className="conditions-heading"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span>
          <SlidersHorizontal size={14} /> Conditions
        </span>
        <ChevronDown size={14} />
      </button>
      <div className="conditions-content">
        <div className="weather-options" aria-label="Weather preset">
          {presets.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={settings.weather === id ? "selected" : ""}
              aria-pressed={settings.weather === id}
              onClick={(event) => {
                setSettings((value) => ({
                  ...value,
                  weather: id,
                  wind: WEATHER[id].wind,
                }));
                event.currentTarget.blur();
              }}
            >
              <Icon size={20} strokeWidth={1.4} />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="wind-label">
          <label htmlFor="wind-speed">
            <Wind size={14} /> Wind speed
          </label>
          <span>
            {settings.wind}
            <small> km/h</small>
          </span>
        </div>
        <input
          id="wind-speed"
          onPointerUp={(event) => event.currentTarget.blur()}
          aria-label="Wind speed"
          type="range"
          min="0"
          max="50"
          value={settings.wind}
          style={{ "--range-progress": `${settings.wind * 2}%` }}
          onChange={(event) =>
            setSettings((value) => ({
              ...value,
              wind: Number(event.target.value),
            }))
          }
        />
        <div className="range-labels">
          <span>Calm</span>
          <span>Strong</span>
        </div>
        <div className="conditions-details">
          <div>
            <span>
              <ArrowUpRight size={14} /> Wind direction
            </span>
            <strong>
              NW <em>315°</em>
            </strong>
          </div>
          <div>
            <span>
              <ArrowUp size={14} /> Thermal strength
            </span>
            <strong className="lime">
              {weather.thermal.toFixed(1)} <em>m/s</em>
            </strong>
          </div>
          <div>
            <span>
              <CloudSun size={14} /> Cloud base
            </span>
            <strong>
              {weather.cloudBase.toLocaleString()} <em>m</em>
            </strong>
          </div>
        </div>
        <div className="weather-note">
          <span
            className={`status-dot ${settings.weather === "storm" ? "amber" : ""}`}
          />
          <span>{weather.label}</span>
          <span>{weather.temperature}°C</span>
        </div>
      </div>
    </aside>
  );
}
