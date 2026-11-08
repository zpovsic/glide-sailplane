import { Maximize2, Navigation } from "lucide-react";
import { terrainHeight, THERMALS } from "../sim/physics";

const SIZE = 220,
  RANGE = 12000;
const coord = (n) => (n / RANGE + 0.5) * SIZE;
function contours() {
  const paths = [];
  const steps = 48,
    cell = RANGE / steps;
  for (let level = 700; level < 3400; level += 270) {
    let path = "";
    for (let row = 0; row < steps; row++)
      for (let col = 0; col < steps; col++) {
        const x = col * cell - RANGE / 2,
          z = row * cell - RANGE / 2;
        const pts = [
          [x, z],
          [x + cell, z],
          [x + cell, z + cell],
          [x, z + cell],
        ];
        const vals = pts.map(([a, b]) => terrainHeight(a, b));
        const edges = [];
        for (let k = 0; k < 4; k++) {
          const j = (k + 1) % 4;
          if (vals[k] < level !== vals[j] < level) {
            const t = (level - vals[k]) / (vals[j] - vals[k]);
            edges.push([
              coord(pts[k][0] + (pts[j][0] - pts[k][0]) * t),
              coord(pts[k][1] + (pts[j][1] - pts[k][1]) * t),
            ]);
          }
        }
        if (edges.length >= 2)
          path += `M${edges[0][0].toFixed(1)},${edges[0][1].toFixed(1)}L${edges[1][0].toFixed(1)},${edges[1][1].toFixed(1)}`;
        if (edges.length === 4)
          path += `M${edges[2][0].toFixed(1)},${edges[2][1].toFixed(1)}L${edges[3][0].toFixed(1)},${edges[3][1].toFixed(1)}`;
      }
    paths.push(path);
  }
  return paths;
}
const mapContours = contours();

export default function FlightMap({
  state,
  thermals,
  expanded = false,
  onExpand,
}) {
  const x = coord(state.x),
    z = coord(state.z);
  const mapSize = expanded ? 300 : 220;
  return (
    <div className={`flight-map glass ${expanded ? "expanded-map" : ""}`}>
      <div className="map-heading">
        <span>
          <Navigation size={12} /> Flight map
        </span>
        {!expanded && (
          <button
            className="icon-button"
            onClick={onExpand}
            aria-label="Expand flight map"
          >
            <Maximize2 size={13} />
          </button>
        )}
      </div>
      <svg
        className="map-svg"
        viewBox={`${x - mapSize / 2} ${z - mapSize / 2} ${mapSize} ${mapSize}`}
        role="img"
        aria-label="Topographic flight map with your position and nearby thermals"
      >
        <defs>
          <radialGradient id={expanded ? "mapGlowLarge" : "mapGlow"}>
            <stop offset="0" stopColor="#62856b" stopOpacity="0.22" />
            <stop offset="1" stopColor="#263e33" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          x={x - mapSize}
          y={z - mapSize}
          width={mapSize * 2}
          height={mapSize * 2}
          fill={`url(#${expanded ? "mapGlowLarge" : "mapGlow"})`}
        />
        <g fill="none" stroke="#79937a" strokeWidth="0.65" opacity="0.28">
          {mapContours.map((path, i) => (
            <path key={i} d={path} />
          ))}
        </g>
        <circle
          cx={x}
          cy={z}
          r="60"
          stroke="#a1b9a1"
          strokeWidth="0.55"
          opacity="0.15"
          fill="none"
        />
        <circle
          cx={x}
          cy={z}
          r="95"
          stroke="#a1b9a1"
          strokeWidth="0.55"
          opacity="0.15"
          fill="none"
        />
        <path
          d={`M${x - 5},${z}h10M${x},${z - 5}v10`}
          stroke="#bed0b4"
          strokeWidth="0.5"
          opacity="0.4"
        />
        {thermals &&
          THERMALS.map((thermal, i) => (
            <g key={i}>
              <circle
                cx={coord(thermal.x)}
                cy={coord(thermal.z)}
                r="7"
                fill="#d5f3a2"
                fillOpacity="0.08"
                stroke="#d5f3a2"
                strokeOpacity="0.5"
                strokeWidth="0.7"
              />
              <circle
                cx={coord(thermal.x)}
                cy={coord(thermal.z)}
                r="1.6"
                fill="#d5f3a2"
                opacity="0.8"
              />
            </g>
          ))}
        <polyline
          points={state.trail
            .map((p) => `${coord(p.x)},${coord(p.z)}`)
            .join(" ")}
          fill="none"
          stroke="#d9f5a6"
          strokeWidth="1.1"
          strokeDasharray="2 2"
          opacity="0.7"
        />
        <g
          transform={`translate(${x} ${z}) rotate(${(state.heading * 180) / Math.PI})`}
        >
          <circle r="13" fill="#d9f5a6" opacity="0.09" />
          <path d="M0 -7 4 5 0 3 -4 5Z" fill="#e4f5ce" />
        </g>
      </svg>
      <div className="map-north">
        N<span />
      </div>
      <div className="map-scale">
        <span /> 2 km
      </div>
      <div className="map-legend">
        <i /> Thermal
      </div>
    </div>
  );
}
