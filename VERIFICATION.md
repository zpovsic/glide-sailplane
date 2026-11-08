# Verification — 8 November 2026

The sailplane simulation is implemented and verified against the written visual specification in `DESIGN.md`.

## Functional checks

- `npm test`: all nine deterministic physics tests pass. They cover paused/ready state, forward gliding and sink, wind drift, bank and recovery, pitch/airspeed tradeoff and stall, thermal lift and cloud-base cutoff, weather effects, collision, flight bounds and reset.
- `npm run build`: production build passes. Vite reports its standard size advisory for the Three.js chunk (512 kB minified, 130 kB gzip); the rendering engine is already split from the application.
- Built-in browser testing: start flight; hold the right arrow and observe heading change to 39 degrees; pause/resume; restart; switch to cockpit view; change sunny/cloudy/storm conditions; adjust wind by keyboard; toggle sound and thermal display; open help, flight log and the expanded map.
- Dialogs pause flight and restore the previous flight state when closed. Starting from an already paused state preserves that state.
- Touch bank input changes heading and clears on release. The phone layout includes nose-down and nose-up controls.
- No error or warning entries from the fresh production preview origin. Earlier development hot-reload messages after dependency changes were resolved by reloading and checked separately from production.
- Final view: ready to fly, fair weather, thermals visible, sound off, chase camera.

## Visual checks

The built-in browser was used throughout; there was no external Playwright fallback. Desktop was inspected at 1280 × 720 during development and at the native 840 × 732 browser viewport for final verification. The phone viewport was checked at 390 × 844. A larger 1440 × 900 capture was affected by the browser's display scaling and was discarded. All viewport overrides were reset.

Final browser captures were saved to `output/glide-desktop.jpg` and `output/glide-mobile.jpg`, and both were inspected using `view_image`.

| Comparison point | Evidence and outcome |
| --- | --- |
| Composition | Full-screen flight canvas between the header and status bar; glider remains visible above the instruments. Fixed the initial chase-camera aim that put the aircraft behind the HUD. |
| Typography | Editorial serif title, consistent sans-serif chrome, tabular flight values, and compact labels checked on both layouts. |
| Palette | Pine-green chrome and panels, pale lime actions and lift accents, muted sage labels, and atmospheric alpine scenery match the design tokens. |
| Native assets | Sailplane, mountain terrain, river, trees, clouds, thermal particles and streamlines render as navigable Three.js geometry and effects. |
| Panels and spacing | Conditions, map and instruments retain their intended separation. Fixed the expanded map's responsive width; its measured width is 412 px inside the 490 px dialog. |
| Responsive behavior | No horizontal overflow at the final desktop or phone sizes. Conditions collapse on phones; touch controls remain separate from the flight instruments. |
| Interaction states | Sunny/cloudy/storm selections, thermal toggle, camera button, pause state, flight log, focus styles and dialog controls respond to real application state. |
| Copy | The final welcome surface contains “Find your lift.”, “No engine. No rush.”, “Just you, the wind, and a little instinct.”, “Start flying”, and “Your sky. Your pace.” The decorative region eyebrow was removed; the region remains in the location and flight context. |

## Intentional deviations and scope

No accepted image concept exists: the built-in image-generation tool was unavailable, and the API fallback was not invoked without opt-in. Fidelity was assessed against the written design, not a generated reference image. Native 3D art is the intentional asset choice for the navigable simulation. The landscape is a fictionalized alpine region, and the accessible flight model is not a certified flight-training model.

No remaining material layout mismatch was observed in the tested viewports.
