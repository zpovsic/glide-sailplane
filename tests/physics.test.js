import test from "node:test";
import assert from "node:assert/strict";
import {
  createFlight,
  stepFlight,
  thermalLift,
  terrainHeight,
  THERMALS,
  WEATHER,
} from "../src/sim/physics.js";

const neutral = { left: false, right: false, up: false, down: false };
const calm = { weather: "sunny", wind: 0 };
function fly(state, seconds, input = neutral, settings = calm) {
  for (let i = 0; i < seconds * 60; i++)
    stepFlight(state, input, settings, 1 / 60);
  return state;
}
function airborne() {
  return { ...createFlight(), status: "flying" };
}

test("ready and paused flights do not advance physics", () => {
  for (const status of ["ready", "paused"]) {
    const state = { ...createFlight(), status };
    const before = structuredClone(state);
    fly(state, 10);
    assert.deepEqual(state, before);
  }
});
test("a level glider moves forward and loses altitude outside lift", () => {
  const state = airborne();
  state.z = 7000;
  state.altitude = 4200;
  fly(state, 20);
  assert.ok(state.z < 6600);
  assert.ok(state.altitude < 4195);
  assert.ok(state.distance > 400);
});
test("wind changes ground position but not airspeed", () => {
  const still = fly(airborne(), 15);
  const windy = fly(airborne(), 15, neutral, { weather: "sunny", wind: 36 });
  assert.ok(windy.x > still.x + 100);
  assert.equal(windy.speed, still.speed);
});
test("banking turns the aircraft and straightens after releasing control", () => {
  const state = fly(airborne(), 5, { ...neutral, right: true });
  assert.ok(state.heading > 0.8);
  assert.ok(state.bank > 0.7);
  fly(state, 3);
  assert.ok(state.bank < 0.01);
});
test("pitch trades airspeed for altitude and aggressive climb can stall", () => {
  const diving = fly(airborne(), 10, { ...neutral, up: true });
  const climbing = fly(airborne(), 10, { ...neutral, down: true });
  assert.ok(diving.speed > climbing.speed + 10);
  assert.ok(climbing.altitude > diving.altitude);
  assert.ok(climbing.stalled);
});
test("thermal core lifts the glider and weakens above cloud base", () => {
  const thermal = THERMALS[0];
  const core = thermalLift(thermal.x, thermal.z, 1840, 0, WEATHER.sunny);
  const outside = thermalLift(
    thermal.x + 800,
    thermal.z,
    1840,
    0,
    WEATHER.sunny,
  );
  const above = thermalLift(thermal.x, thermal.z, 3200, 0, WEATHER.sunny);
  assert.ok(core > 3);
  assert.ok(outside < core / 4);
  assert.equal(above, 0);
  const state = airborne();
  state.x = thermal.x;
  state.z = thermal.z;
  fly(state, 5);
  assert.ok(state.altitude > 1845);
  assert.ok(state.thermalTime > 4);
});
test("weather changes thermal strength and turbulence", () => {
  const thermal = THERMALS[0];
  const sunny = thermalLift(thermal.x, thermal.z, 1500, 0, WEATHER.sunny);
  const cloudy = thermalLift(thermal.x, thermal.z, 1500, 0, WEATHER.cloudy);
  assert.ok(sunny > cloudy);
  const good = fly(airborne(), 10);
  const storm = fly(airborne(), 10, neutral, { weather: "storm", wind: 0 });
  assert.notEqual(good.heading, storm.heading);
  assert.notEqual(good.altitude, storm.altitude);
});
test("terrain collision ends flight and cannot run below the surface", () => {
  const state = airborne();
  state.altitude = terrainHeight(state.x, state.z) + 4;
  fly(state, 1);
  assert.equal(state.status, "landed");
  const elapsed = state.time;
  fly(state, 10);
  assert.equal(state.time, elapsed);
  assert.ok(state.altitude >= terrainHeight(state.x, state.z));
});
test("world boundary ends flight and a fresh flight clears the log", () => {
  const state = airborne();
  state.x = 19001;
  fly(state, 1);
  assert.equal(state.status, "boundary");
  const fresh = createFlight();
  assert.equal(fresh.time, 0);
  assert.equal(fresh.distance, 0);
  assert.deepEqual(fresh.trail, []);
});
