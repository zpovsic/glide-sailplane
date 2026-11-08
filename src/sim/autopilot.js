import { THERMALS, WEATHER, terrainHeight } from "./physics.js";
import { gliderSpec } from "./gliders.js";

const TAU = Math.PI * 2;
const ORBIT_RADIUS = 140;
const GLIDE_RATIO = 28;
const SAFE_CLEARANCE = 160;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const wrap = (angle) => ((((angle + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const bearing = (fromX, fromZ, toX, toZ) => Math.atan2(toX - fromX, fromZ - toZ);

export function createAutopilot() {
  return {
    mode: "cruise",
    target: null,
    visited: [],
    modeTime: 0,
    vario: 0,
    closest: Infinity,
    stuckTime: 0,
  };
}

function thermalCenter(index, time) {
  const thermal = THERMALS[index];
  return { x: thermal.x + Math.sin(time / 120) * 60, z: thermal.z };
}

function pathClearance(state, heading, length = 1800) {
  let worst = Infinity;
  for (let d = 150; d <= length; d += 150) {
    const x = state.x + Math.sin(heading) * d;
    const z = state.z - Math.cos(heading) * d;
    const altitude = state.altitude - d / GLIDE_RATIO;
    worst = Math.min(worst, altitude - terrainHeight(x, z));
  }
  return worst;
}

// Heading through the air that makes the ground track point along `track`,
// given the southeast drift used by the flight model.
function crabHeading(track, speed, wind) {
  const drift = wind / 3.6 / Math.SQRT2;
  const ux = Math.sin(track),
    uz = -Math.cos(track);
  const along = drift * ux + drift * uz;
  const px = drift - along * ux,
    pz = drift - along * uz;
  const cross = Math.hypot(px, pz);
  if (cross >= speed) return track;
  const forward = Math.sqrt(speed * speed - cross * cross);
  return Math.atan2(forward * ux - px, -(forward * uz - pz));
}

function chooseThermal(state, settings, pilot) {
  if (pilot.visited.length >= THERMALS.length - 1) pilot.visited = pilot.visited.slice(-1);
  const drift = settings.wind / 3.6 / Math.SQRT2;
  let best = null,
    bestScore = Infinity;
  THERMALS.forEach((thermal, index) => {
    if (pilot.visited.includes(index)) return;
    const center = thermalCenter(index, state.time);
    const dx = center.x - state.x,
      dz = center.z - state.z;
    const distance = Math.hypot(dx, dz);
    const tailwind = (drift * dx + drift * dz) / distance;
    const groundSpeed = Math.max(5, state.speed + tailwind);
    const heading = bearing(state.x, state.z, center.x, center.z);
    const blocked = pathClearance(state, heading, Math.min(distance, 3000)) < 60;
    const score = ((distance / groundSpeed) * 26) / thermal.strength + (blocked ? 4000 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

function retarget(state, settings, pilot) {
  pilot.visited.push(pilot.target);
  pilot.target = chooseThermal(state, settings, pilot);
  pilot.mode = "cruise";
  pilot.modeTime = 0;
  pilot.closest = Infinity;
  pilot.stuckTime = 0;
}

function avoidTerrain(state, desired) {
  if (pathClearance(state, desired) > SAFE_CLEARANCE) return desired;
  let best = desired,
    bestScore = -Infinity;
  for (let step = -6; step <= 6; step++) {
    const heading = desired + (step * Math.PI) / 6;
    const score = pathClearance(state, heading) - Math.abs(step) * 15;
    if (score > bestScore) {
      bestScore = score;
      best = heading;
    }
  }
  return best;
}

export function autopilotInput(state, settings, pilot, dt) {
  const weather = WEATHER[settings.weather];
  const glider = gliderSpec(settings.glider);
  if (pilot.target === null) pilot.target = chooseThermal(state, settings, pilot);
  pilot.modeTime += dt;
  pilot.vario += (state.verticalSpeed - pilot.vario) * Math.min(1, dt / 12);
  const center = thermalCenter(pilot.target, state.time);
  const distance = Math.hypot(center.x - state.x, center.z - state.z);
  const toCenter = bearing(state.x, state.z, center.x, center.z);

  if (pilot.mode === "cruise") {
    if (distance < pilot.closest - 20) {
      pilot.closest = distance;
      pilot.stuckTime = 0;
    } else pilot.stuckTime += dt;
    if (distance < THERMALS[pilot.target].radius * 0.8) {
      pilot.mode = "climb";
      pilot.modeTime = 0;
      pilot.vario = Math.max(pilot.vario, 0.5);
    } else if (pilot.stuckTime > 60) retarget(state, settings, pilot);
  } else if (state.altitude > weather.cloudBase - 50 || (pilot.modeTime > 40 && pilot.vario < 0.25))
    retarget(state, settings, pilot);

  let desired, feedForward;
  if (pilot.mode === "climb") {
    const radial = clamp((distance - ORBIT_RADIUS) / ORBIT_RADIUS, -1, 1);
    desired = toCenter - Math.PI / 2 + radial * 0.9;
    feedForward = Math.atan((state.speed * state.speed) / (9.81 * ORBIT_RADIUS)) / glider.maxBank;
  } else {
    desired = crabHeading(toCenter, state.speed, settings.wind);
    feedForward = 0;
  }
  const heading = avoidTerrain(state, desired);
  if (heading !== desired) feedForward = 0;
  const error = wrap(heading - state.heading);
  const bank = clamp(feedForward + error * 1.4, -1, 1);
  const pitch = clamp((state.speed - glider.trimSpeed - 1) / 6, -1, 1);
  return {
    left: Math.max(0, -bank),
    right: Math.max(0, bank),
    up: Math.max(0, -pitch),
    down: Math.max(0, pitch),
  };
}
