import { useEffect, useRef, useState } from "react";
import { createWorld } from "../sim/world";

export default function FlightScene({ sim }) {
  const container = useRef(null),
    latest = useRef(sim);
  const [error, setError] = useState(false);
  latest.current = sim;
  useEffect(() => {
    let world;
    try {
      world = createWorld(container.current);
    } catch (cause) {
      console.error("Unable to create flight renderer", cause);
      setError(true);
      return;
    }
    let handle,
      previous = performance.now(),
      accumulator = 0,
      publishTimer = 0,
      clock = 0;
    const loop = (now) => {
      const dt = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      clock += dt;
      accumulator += dt * latest.current.settings.timeScale;
      publishTimer += dt;
      while (accumulator >= 1 / 60) {
        latest.current.tick(1 / 60);
        accumulator -= 1 / 60;
      }
      world.render(
        latest.current.flight.current,
        latest.current.settings,
        latest.current.camera,
        clock,
        dt,
      );
      if (publishTimer > 0.12) {
        latest.current.publish();
        publishTimer = 0;
      }
      handle = requestAnimationFrame(loop);
    };
    handle = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(handle);
      world.dispose();
    };
  }, []);
  return (
    <div className="flight-scene" ref={container}>
      {error && (
        <div className="render-error">
          <h2>A little turbulence.</h2>
          <p>
            This simulation needs WebGL. Enable hardware acceleration in your browser and reload to
            fly.
          </p>
          <button className="primary-button" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
