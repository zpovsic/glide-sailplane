# Glide design

A full-screen, flyable sailplane simulation over a fictionalized Julian Alps landscape. The user can bank, pitch, enter thermals, change weather and wind, pause, restart, switch camera, and review the current flight log.

## Visual specification

- Live 3D scene fills the space between a 76px header and 42px status footer.
- Deep pine UI (#17211e), translucent green-black panels, chalk-white text, muted sage secondary text, pale lime (#d9f5a6) actions and lift indicators.
- UI uses a clean sans serif; the welcome heading uses an editorial serif. Tabular numerals for flight instruments.
- Header: Glide brand, Flight deck / Flight log navigation, location, sound, help.
- Upper left: “Find your lift.”, brief introduction and “Start flying” action. In-flight replacement: region and current lift cue.
- Upper right: Conditions panel with Sunny / Cloudy / Storm presets, wind speed slider, wind direction, thermal strength, cloud base.
- Center: a detailed white sailplane, distant snowy ridgelines, layered green alpine slopes, river, trees, volumetric-looking cumulus clouds, optional rising thermal particles.
- Bottom left: circular-range topographic minimap with glider, trail, thermal locations and map expand action.
- Bottom center: compact keyboard hints, four flight instruments, pause/restart/camera buttons.
- Footer: aircraft, flight state, elapsed time, distance, thermal overlay toggle.
- Responsive: simplified header, collapsible conditions, compact instruments and touch controls on narrow screens.

## Intentional asset deviation

The built-in image generation tool is unavailable. No generated concept was created, and the API fallback was not invoked without opt-in. Geometry, materials, sky shading, terrain vertex colors and particles are authored in Three.js because the requested environment must remain navigable in three dimensions. SVG is used for native icons and the dynamic map.

## Interaction rules

Arrow keys or WASD bank and pitch; Space pauses; R restarts; C switches chase/cockpit camera; T toggles thermal visualization. Touch controls hold their input until released. All weather controls alter the running physical model. Physics uses a fixed-step integration and explicit collision, stall, and weather state. Modal dialogs pause the flight and restore its prior state when closed.
