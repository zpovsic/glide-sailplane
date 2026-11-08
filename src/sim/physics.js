export const WEATHER = {
  sunny: {
    label: "Fair weather",
    description: "Blue skies. Good lift. Your kind of day.",
    wind: 12,
    thermal: 3.8,
    cloudBase: 2600,
    turbulence: 0.12,
    temperature: 21,
    visibility: "40+ km",
  },
  cloudy: {
    label: "Overcast",
    description: "Softer light. Hunt for pockets of lift.",
    wind: 20,
    thermal: 2.1,
    cloudBase: 2200,
    turbulence: 0.3,
    temperature: 16,
    visibility: "18 km",
  },
  storm: {
    label: "Storm front",
    description: "Strong gusts. Stay clear of the terrain.",
    wind: 36,
    thermal: 5.6,
    cloudBase: 1900,
    turbulence: 1.5,
    temperature: 12,
    visibility: "8 km",
  },
};

export const THERMALS = [
  { x: 180, z: 900, radius: 330, strength: 1 },
  { x: -1000, z: -1800, radius: 440, strength: 1.15 },
  { x: 1500, z: -4200, radius: 380, strength: 0.9 },
  { x: -1800, z: -6500, radius: 500, strength: 1.2 },
  { x: 800, z: 4300, radius: 400, strength: 0.85 },
  { x: 3600, z: -8500, radius: 420, strength: 1.1 },
  { x: -3000, z: 1500, radius: 380, strength: 0.9 },
  { x: 2200, z: 7000, radius: 480, strength: 1.15 },
];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const mix = (a, b, t) => a + (b - a) * t;
function hash(x, y) {
  const a = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return a - Math.floor(a);
}
export function noise(x, y) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    fx = x - ix,
    fy = y - iy;
  const u = fx * fx * (3 - 2 * fx),
    v = fy * fy * (3 - 2 * fy);
  return mix(
    mix(hash(ix, iy), hash(ix + 1, iy), u),
    mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), u),
    v,
  );
}
export function valleyCenter(z) {
  return 650 * Math.sin(z / 4200) + 420 * Math.sin(z / 1900);
}
export function terrainHeight(x, z) {
  const riverDistance = Math.abs(x - valleyCenter(z));
  const valley = 1 - Math.exp(-Math.pow(riverDistance / 3300, 1.6));
  let detail = 0,
    amp = 1,
    freq = 1,
    total = 0;
  for (let i = 0; i < 6; i++) {
    detail += noise((x / 2200) * freq, (z / 2200) * freq) * amp;
    total += amp;
    amp *= 0.51;
    freq *= 2.05;
  }
  const ridge = Math.pow(
    1 - Math.abs(noise(x / 4700 + 2, z / 3500) * 2 - 1),
    2,
  );
  const base = 300 + (Math.sin(z / 8000) + 1) * 90;
  return (
    base + valley * (850 + ridge * 1550 + (detail / total) * 1650) + detail * 90
  );
}

export function createFlight() {
  return {
    x: 0,
    z: 2400,
    altitude: 1840,
    speed: 26.1,
    heading: 0,
    bank: 0,
    pitch: 0,
    verticalSpeed: -0.7,
    lift: 0,
    time: 0,
    distance: 0,
    maxAltitude: 1840,
    maxLift: 0,
    thermalTime: 0,
    status: "ready",
    stalled: false,
    trail: [],
    trailTimer: 0,
  };
}

export function thermalLift(x, z, altitude, time, weather) {
  let lift = 0;
  for (const thermal of THERMALS) {
    const dx = x - thermal.x - Math.sin(time / 120) * 60;
    const dz = z - thermal.z;
    const r2 = (dx * dx + dz * dz) / (thermal.radius * thermal.radius);
    const heightFactor = clamp(
      (weather.cloudBase + 250 - altitude) / 450,
      0,
      1,
    );
    lift +=
      weather.thermal * thermal.strength * Math.exp(-r2 * 1.5) * heightFactor;
    lift -=
      0.25 * Math.exp(-Math.pow(Math.sqrt(r2) - 1.8, 2) * 3) * heightFactor;
  }
  return lift;
}

export function stepFlight(state, input, settings, dt) {
  if (state.status !== "flying") return state;
  const weather = WEATHER[settings.weather];
  const bankInput = Number(input.right) - Number(input.left);
  const pitchInput = Number(input.down) - Number(input.up);
  state.bank = mix(state.bank, bankInput * 0.78, Math.min(1, dt * 2.4));
  state.pitch = mix(state.pitch, pitchInput * 0.15, Math.min(1, dt * 1.6));
  const gust =
    (Math.sin(state.time * 1.7) + Math.sin(state.time * 3.1) * 0.4) *
    weather.turbulence;
  state.heading +=
    ((9.81 * Math.tan(state.bank)) / Math.max(15, state.speed) + gust * 0.006) *
    dt;
  state.heading = (state.heading + Math.PI * 2) % (Math.PI * 2);
  state.speed = clamp(
    state.speed + (-state.pitch * 9.81 + (26.1 - state.speed) * 0.055) * dt,
    14,
    64,
  );
  state.stalled = state.speed < 18.5;
  const sink =
    0.66 +
    0.0038 * Math.pow(state.speed - 25, 2) +
    Math.pow(Math.abs(state.bank), 2) * 1.7;
  state.lift = thermalLift(
    state.x,
    state.z,
    state.altitude,
    state.time,
    weather,
  );
  const slopeX =
    (terrainHeight(state.x + 60, state.z) -
      terrainHeight(state.x - 60, state.z)) /
    120;
  const ridgeLift =
    clamp((slopeX * settings.wind) / 12, -1.8, 1.8) *
    clamp(1 - (state.altitude - terrainHeight(state.x, state.z)) / 700, 0, 1);
  const targetVario =
    state.lift +
    ridgeLift -
    sink +
    state.pitch * state.speed +
    gust * 0.4 -
    (state.stalled ? 4 : 0);
  state.verticalSpeed = mix(
    state.verticalSpeed,
    targetVario,
    Math.min(1, dt * 2),
  );
  state.altitude += state.verticalSpeed * dt;
  // Wind is from the northwest: the air mass drifts southeast.
  const drift = settings.wind / 3.6 / Math.sqrt(2);
  const vx = Math.sin(state.heading) * state.speed + drift + gust;
  const vz = -Math.cos(state.heading) * state.speed + drift;
  state.x += vx * dt;
  state.z += vz * dt;
  state.distance += Math.hypot(vx, vz) * dt;
  state.time += dt;
  state.maxAltitude = Math.max(state.maxAltitude, state.altitude);
  state.maxLift = Math.max(state.maxLift, state.verticalSpeed);
  if (state.lift > 0.8) state.thermalTime += dt;
  state.trailTimer += dt;
  if (state.trailTimer > 1.5) {
    state.trail.push({ x: state.x, z: state.z, altitude: state.altitude });
    if (state.trail.length > 240) state.trail.shift();
    state.trailTimer = 0;
  }
  if (state.altitude <= terrainHeight(state.x, state.z) + 5) {
    state.altitude = terrainHeight(state.x, state.z) + 5;
    state.status = "landed";
  }
  if (Math.abs(state.x) > 19000 || Math.abs(state.z) > 19000)
    state.status = "boundary";
  return state;
}

export function formatTime(seconds) {
  const value = Math.floor(seconds);
  return `${Math.floor(value / 60)
    .toString()
    .padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`;
}
