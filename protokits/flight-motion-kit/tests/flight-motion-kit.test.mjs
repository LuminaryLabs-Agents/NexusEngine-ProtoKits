import assert from "node:assert/strict";
import { createFlightState, stepFlight } from "../index.js";

function simulate(state, input, seconds, terrainSampler = null) {
  let next = state;
  const dt = 1 / 60;
  for (let i = 0; i < seconds * 60; i += 1) next = stepFlight(next, input, dt, terrainSampler);
  return next;
}

const flatTerrain = { getHeight: () => 0 };

{
  const state = createFlightState({ physics: { controlMode: "assisted", targetPitch: 0.04, minForwardSpeed: 42, minimumAirspeed: 48, safeClearance: 90 } });
  state.position = { x: 0, y: 190, z: 0 };
  state.velocity = { x: 0, y: -8, z: -74 };
  state.rotation = { pitch: -0.32, yaw: 0, roll: 0.7 };
  const next = simulate(state, {}, 10, flatTerrain);
  assert.equal(next.control.mode, "assisted");
  assert.equal(next.stability.active, true);
  assert.ok(Math.abs(next.rotation.roll) < 0.18);
  assert.ok(next.position.y > 60);
  assert.ok(next.speed > 35);
}

{
  const terrain = { getHeight: () => 100 };
  const state = createFlightState({ physics: { controlMode: "assisted", safeClearance: 130, criticalClearance: 70, terrainLift: 28, terrainPitchBias: 0.24 } });
  state.position = { x: 0, y: 150, z: 0 };
  state.velocity = { x: 0, y: -30, z: -65 };
  state.rotation = { pitch: -0.2, yaw: 0, roll: 0 };
  const next = simulate(state, {}, 3, terrain);
  assert.equal(next.stability.terrainAvoidanceActive, true);
  assert.ok(next.position.y - terrain.getHeight() > 30);
  assert.ok(next.rotation.pitch > -0.12);
}

{
  const state = createFlightState({ physics: { controlMode: "manual" } });
  state.rotation = { pitch: 0, yaw: 0, roll: 0.5 };
  const next = simulate(state, {}, 1, flatTerrain);
  assert.equal(next.control.mode, "manual");
  assert.equal(next.stability.active, false);
}

console.log("flight-motion-kit assisted stability tests passed.");
