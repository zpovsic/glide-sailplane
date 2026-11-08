# Glide

A flyable sailplane simulation in a fictionalized Julian Alps landscape. Built with React, Vite, and Three.js.

Requires Node.js 20.19+ (20.x), or Node.js 22.12+ and newer, as required by Vite 7.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. A browser with WebGL support is required.

## Flying

Before takeoff, choose a glider: the **ASK 21** trainer rolls quickly and stalls late but sinks faster, the **LS8-18** is the balanced default, and the **Nimbus-4** glides furthest but turns slowly and needs more speed. Restart to pick again.

- **← / →** or **A / D**: bank left / right.
- **↑ / ↓** or **W / S**: nose down / up. Climbing trades airspeed for altitude.
- **Space**: pause or resume.
- **C**: switch between chase and cockpit cameras.
- **T**: show or hide thermal particles and map markers.
- **R**: reset the flight.
- **P**: let the AI pilot fly. It glides to the nearest thermal, circles to climb toward cloud base, then moves on while steering clear of terrain. Any steering input hands control back to you.
- Touch controls appear on narrow screens.

Fly into the pale green thermal columns, then circle to stay in the rising air. The vertical-speed instrument shows whether you are climbing. Weather presets change thermal strength, cloud base, visibility, lighting and turbulence. The wind slider changes drift over the ground; airspeed is measured relative to the moving air. Opening a dialog or leaving the browser pauses the flight.

The flight log records duration, distance, highest altitude, best climb, and time in thermals for the current flight. Restarting clears it. Enable sound for wind noise and a climbing variometer.

## Verification

```sh
npm test
npm run build
```

The deterministic physics tests cover controls, pause, energy tradeoffs, thermal lift, wind drift, weather, terrain collision and flight boundaries. The flight dynamics are intentionally approachable and are not a certified flight-training model. Terrain is procedural rather than geographic survey data.

## Structure

- `src/sim/physics.js`: fixed-step flight model, thermal fields and shared terrain.
- `src/sim/world.js`: 3D landscape, sailplane, sky, clouds, rain and cameras.
- `src/hooks`: flight state, keyboard lifecycle and audio.
- `src/components`: conditions, instruments, map, renderer and dialogs.
- `DESIGN.md`: visual system and asset decisions.
