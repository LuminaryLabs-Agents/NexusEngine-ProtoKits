import assert from "node:assert/strict";
import { createFlightState, stepFlight } from "../index.js";

function simulate(state, input, seconds, terrainSampler = null) {
  let next = state;
  const dt = 1 / 60;
  for (let i = 0; i < seconds * 60; i += 1) next = stepFlight(next, input, dt, terrainSampler);
  return next;
}

function seed(overrides = {}) {
  const state = createFlightState({
    physics: {
      controlMode: "assisted",
      controlResponseMode: "direct",
      flightPathAlignment: true,
      carveMode: "screen-focus",
      targetPitch: 0.04,
      minForwardSpeed: 42,
      minimumAirspeed: 48,
      safeClearance: 90,
      maxSpeed: 170,
      ...overrides
    }
  });
  state.position = { x: 0, y: 220, z: 0 };
  state.velocity = { x: 0, y: -4, z: -86 };
  state.rotation = { pitch: 0, yaw: 0, roll: 0 };
  return state;
}

const flatTerrain = { getHeight: () => 0 };

{
  const state = seed();
  state.rotation = { pitch: -0.32, yaw: 0, roll: 0.7 };
  const next = simulate(state, {}, 10, flatTerrain);
  assert.equal(next.control.mode, "assisted");
  assert.equal(next.control.responseMode, "direct");
  assert.equal(next.stability.active, true);
  assert.equal(next.carve.active, true);
  assert.ok(Math.abs(next.rotation.roll) < 0.14, `auto-level should unwind roll: ${next.rotation.roll}`);
  assert.ok(next.position.y > 70);
  assert.ok(next.speed > 35);
}

{
  const neutral = simulate(seed(), {}, 1.4, flatTerrain);
  const up = simulate(seed(), { pitchUp: true }, 1.4, flatTerrain);
  const down = simulate(seed(), { pitchDown: true }, 1.4, flatTerrain);
  assert.ok(up.velocity.y > neutral.velocity.y + 8, `pitch up should raise vertical velocity: ${up.velocity.y} <= ${neutral.velocity.y}`);
  assert.ok(down.velocity.y < neutral.velocity.y - 8, `pitch down should lower vertical velocity: ${down.velocity.y} >= ${neutral.velocity.y}`);
  assert.ok(up.carve.velocityForwardDot > 0.78);
  assert.ok(down.speed >= neutral.speed * 0.92);
}

{
  const neutral = simulate(seed(), {}, 1.2, flatTerrain);
  const left = simulate(seed(), { bankLeft: true }, 1.2, flatTerrain);
  const right = simulate(seed(), { bankRight: true }, 1.2, flatTerrain);
  assert.ok(left.rotation.roll > 0.32, `bank left should build visible positive roll quickly: ${left.rotation.roll}`);
  assert.ok(right.rotation.roll < -0.32, `bank right should build visible negative roll quickly: ${right.rotation.roll}`);
  assert.ok(left.position.x < neutral.position.x - 8, `bank left should carve negative X: ${left.position.x} vs ${neutral.position.x}`);
  assert.ok(right.position.x > neutral.position.x + 8, `bank right should carve positive X: ${right.position.x} vs ${neutral.position.x}`);
  assert.ok(left.carve.turnStrength > 0.36);
  assert.ok(right.carve.turnStrength > 0.36);
}

{
  const held = simulate(seed(), { bankLeft: true }, 0.7, flatTerrain);
  const released = simulate(held, {}, 1.1, flatTerrain);
  assert.ok(held.rotation.roll > 0.32);
  assert.ok(Math.abs(released.rotation.roll) < Math.abs(held.rotation.roll) * 0.45, `release should auto-level from ${held.rotation.roll} to ${released.rotation.roll}`);
}

{
  const terrain = { getHeight: () => 100 };
  const state = seed({ safeClearance: 130, criticalClearance: 70, terrainLift: 28, terrainPitchBias: 0.24 });
  state.position = { x: 0, y: 150, z: 0 };
  state.velocity = { x: 0, y: -30, z: -65 };
  state.rotation = { pitch: -0.2, yaw: 0, roll: 0 };
  const next = simulate(state, {}, 3, terrain);
  assert.ok(next.position.y - terrain.getHeight() > 30);
  assert.ok(next.rotation.pitch > -0.12);
}

{
  const state = createFlightState({ physics: { controlMode: "manual", flightPathAlignment: false, carveMode: "off" } });
  state.rotation = { pitch: 0, yaw: 0, roll: 0.5 };
  const next = simulate(state, {}, 1, flatTerrain);
  assert.equal(next.control.mode, "manual");
  assert.equal(next.stability.active, false);
  assert.equal(next.carve.active, false);
}

console.log("flight-motion-kit direct assisted carving tests passed.");
