import test from "node:test";
import assert from "node:assert/strict";
import { createFlight, stepFlight } from "../src/sim/physics.js";
import { autopilotInput, createAutopilot } from "../src/sim/autopilot.js";

function autoFly(settings, seconds) {
  const state = { ...createFlight(), status: "flying" };
  const pilot = createAutopilot();
  for (let i = 0; i < seconds * 60 && state.status === "flying"; i++)
    stepFlight(state, autopilotInput(state, settings, pilot, 1 / 60), settings, 1 / 60);
  return { state, pilot };
}

test("autopilot finds thermals and stays airborne in fair weather", () => {
  const { state, pilot } = autoFly({ weather: "sunny", wind: 12 }, 900);
  assert.equal(state.status, "flying");
  assert.ok(state.thermalTime > 120);
  assert.ok(state.maxAltitude > 2300);
  assert.ok(pilot.visited.length >= 1);
});

test("autopilot keeps flying speed above the stall", () => {
  const settings = { weather: "cloudy", wind: 20 };
  const state = { ...createFlight(), status: "flying" };
  const pilot = createAutopilot();
  let stalledTime = 0;
  for (let i = 0; i < 300 * 60 && state.status === "flying"; i++) {
    stepFlight(state, autopilotInput(state, settings, pilot, 1 / 60), settings, 1 / 60);
    if (state.stalled) stalledTime += 1 / 60;
  }
  assert.ok(stalledTime < 1);
});
