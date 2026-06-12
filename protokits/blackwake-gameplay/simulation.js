import { DEFAULT_SEED, clamp, distance, lerp, turnToward } from "./random.js";
import { createBlackwakeWorld } from "./world.js";

export function createBlackwakeState(options = {}) {
  const world = createBlackwakeWorld(options.seed || DEFAULT_SEED);
  const ship = {
    x: world.start.x,
    z: world.start.z + 54,
    heading: -Math.PI / 2,
    velocity: 0,
    sail: 0,
    rudder: 0,
    anchor: false,
    hull: 100,
    cargo: 0,
    cargoValue: 0,
    gold: 60,
    upgrades: { sail: 0, hull: 0, rudder: 0, diving: 0 },
    wake: []
  };
  const player = { mode: "helm", camera: "chase", x: ship.x, z: ship.z, depth: 0, oxygen: 100, carrying: null };
  return {
    id: "blackwake-playable-state",
    seed: options.seed || DEFAULT_SEED,
    time: 0,
    frame: 0,
    world,
    ship,
    player,
    particles: [],
    camera: { x: ship.x, z: ship.z, zoom: 1, angle: ship.heading },
    mapOpen: false,
    quest: { phase: "sail-to-wreck", completedWrecks: 0, delivered: 0 },
    stats: { reefHits: 0, salvaged: 0, upgrades: 0 },
    objective: "Sail to a cyan wreck marker. Leave the helm, dive, salvage cargo, return to port, and upgrade your ship.",
    message: "WASD sail. C cycles camera. M map. F leaves helm. E interacts."
  };
}

export function activePosition(state) {
  return state.player.mode === "swim" || state.player.mode === "dive" ? state.player : state.ship;
}

function pushParticle(state, particle) {
  if (state.particles.length > 520) state.particles.shift();
  state.particles.push(particle);
}

function updateWorld(state, dt) {
  const world = state.world;
  world.storm.target = state.quest.completedWrecks > 2 ? 0.88 : state.quest.completedWrecks > 0 ? 0.46 : 0.2;
  world.storm.intensity = lerp(world.storm.intensity, world.storm.target, 1 - Math.exp(-dt * 0.12));
  world.storm.rain = lerp(world.storm.rain, clamp((world.storm.intensity - 0.35) * 1.7, 0, 1), 1 - Math.exp(-dt * 0.25));
  world.storm.lightning = Math.max(0, world.storm.lightning - dt * 2.5);
  if (world.storm.intensity > 0.52 && world.rng() < dt * world.storm.intensity * 0.22) world.storm.lightning = 1;
  for (const p of state.particles) p.age += dt;
  state.particles = state.particles.filter((p) => p.age < p.life);
}

function updateShip(state, input, dt) {
  const { ship, world } = state;
  const axis = input.axis();
  if (input.tap(" ")) ship.anchor = !ship.anchor;
  const windPower = Math.max(0.22, 0.38 + Math.cos(ship.heading - world.wind.angle) * 0.62);
  ship.sail = clamp(ship.sail + axis.forward * dt * 0.58, -0.3, axis.boost ? 1.2 : 1);
  ship.rudder = lerp(ship.rudder, axis.turn, 1 - Math.exp(-dt * 5.2));
  ship.velocity += ship.sail * (8.5 + ship.upgrades.sail * 2.6) * windPower * dt;
  ship.velocity *= Math.exp(-dt * (ship.anchor ? 3 : 0.34 - ship.upgrades.hull * 0.035));
  ship.velocity = clamp(ship.velocity, -3, 16.5 + ship.upgrades.sail * 3.2);
  ship.heading += ship.rudder * (0.85 + ship.upgrades.rudder * 0.24) * dt * (0.32 + Math.abs(ship.velocity) * 0.058) * Math.sign(ship.velocity || 1);
  const current = world.currentAt(ship.x, ship.z, state.time);
  ship.x += Math.sin(ship.heading) * ship.velocity * dt + current.x * dt * 9;
  ship.z -= Math.cos(ship.heading) * ship.velocity * dt + current.z * dt * 9;
  if (Math.abs(ship.velocity) > 2 && state.frame % 2 === 0) {
    ship.wake.push({ x: ship.x - Math.sin(ship.heading) * 17, z: ship.z + Math.cos(ship.heading) * 17, age: 0, life: 2.1, size: 7 + Math.abs(ship.velocity) * 1.25 });
    if (ship.wake.length > 110) ship.wake.shift();
  }
  for (const w of ship.wake) w.age += dt;
  ship.wake = ship.wake.filter((w) => w.age < w.life);
  for (const island of world.islands) {
    for (const reef of island.reefs) {
      const d = Math.hypot(ship.x - reef.x, ship.z - reef.z);
      if (d < reef.r && Math.abs(ship.velocity) > 1.6) {
        ship.hull = clamp(ship.hull - (1 + Math.abs(ship.velocity) * 0.12) * dt * 18, 0, 100);
        ship.velocity *= Math.exp(-dt * 4.5);
        state.stats.reefHits += dt;
        state.message = "Reef strike — slow down in pale water.";
        pushParticle(state, { kind: "impact", x: ship.x, z: ship.z, age: 0, life: 0.7 });
      }
    }
  }
}

function updatePlayer(state, input, dt) {
  const { player, ship, world } = state;
  const axis = input.axis();
  if (player.mode === "helm") {
    player.x = ship.x;
    player.z = ship.z;
    player.depth = 0;
    if (input.tap("f")) {
      player.mode = "deck";
      state.message = "On deck. Press E for helm or F to jump overboard.";
    }
    return;
  }
  if (player.mode === "deck") {
    player.x = ship.x + Math.cos(ship.heading) * 8;
    player.z = ship.z + Math.sin(ship.heading) * 8;
    player.depth = 0;
    if (input.tap("e")) {
      player.mode = "helm";
      state.message = "At the helm.";
    }
    if (input.tap("f")) {
      player.mode = "swim";
      player.x = ship.x + Math.sin(ship.heading) * 20;
      player.z = ship.z - Math.cos(ship.heading) * 20;
      state.message = "Overboard. Swim with WASD, hold Shift to dive, Space to surface.";
    }
    return;
  }
  if (player.mode === "swim" || player.mode === "dive") {
    const speed = player.mode === "dive" ? 34 : 42;
    player.x += axis.turn * speed * dt;
    player.z -= axis.forward * speed * dt;
    const current = world.currentAt(player.x, player.z, state.time);
    player.x += current.x * dt * 13;
    player.z += current.z * dt * 13;
    if (axis.boost || input.down("shift")) {
      player.mode = "dive";
      player.depth = clamp(player.depth + dt * 9, 0, 34 + ship.upgrades.diving * 12);
    }
    if (input.down(" ")) {
      player.depth = clamp(player.depth - dt * 18, 0, 80);
      if (player.depth <= 0.2) player.mode = "swim";
    }
    if (player.mode === "dive" || player.depth > 1) {
      player.oxygen = clamp(player.oxygen - dt * (4.1 - ship.upgrades.diving * 0.55), 0, 100);
      if (state.frame % 8 === 0) pushParticle(state, { kind: "bubble", x: player.x, z: player.z, age: 0, life: 1.2 });
      if (player.oxygen <= 0) {
        ship.hull = clamp(ship.hull - dt * 3.5, 0, 100);
        state.message = "Out of air — surface or reach the ladder.";
      }
    } else {
      player.oxygen = clamp(player.oxygen + dt * 16, 0, 100);
    }
    if (distance(player, ship) < 25 && input.tap("e")) {
      player.mode = "deck";
      player.depth = 0;
      player.oxygen = 100;
      if (player.carrying) {
        ship.cargo += 1;
        ship.cargoValue += player.carrying.value;
        state.message = `Cargo secured: ${player.carrying.name}. Return to a port.`;
        player.carrying = null;
      } else {
        state.message = "Climbed aboard.";
      }
    }
    const near = world.nearestWreck(player);
    if (near && near.distance < 22 && player.depth > 6 && input.tap("e")) {
      if (!near.wreck.taken) {
        near.wreck.taken = true;
        player.carrying = { name: `${near.island.name} relic crate`, value: near.wreck.value };
        state.quest.completedWrecks += 1;
        state.stats.salvaged += 1;
        state.quest.phase = "return-to-port";
        state.message = "Relic crate recovered. Swim back to the ship ladder and press E.";
      } else {
        state.message = "This wreck is empty.";
      }
    }
  }
}

function updatePorts(state, input) {
  const { ship, world } = state;
  const port = world.nearestPort(ship);
  if (!port || port.distance > 48) return;
  port.island.discovered = true;
  if (input.tap("e") || input.tap("p")) {
    if (ship.cargoValue > 0) {
      ship.gold += ship.cargoValue;
      state.quest.delivered += ship.cargo;
      state.message = `Sold salvage at ${port.port.name} for ${ship.cargoValue} gold.`;
      ship.cargo = 0;
      ship.cargoValue = 0;
      state.quest.phase = "upgrade-ship";
    } else {
      state.message = `${port.port.name}: 1 sails, 2 hull, 3 rudder, 4 diving gear.`;
    }
  }
  const buy = (slot, cost, label) => {
    if (ship.gold >= cost) {
      ship.gold -= cost;
      ship.upgrades[slot] += 1;
      state.stats.upgrades += 1;
      state.message = `${label} upgraded.`;
    } else {
      state.message = `Need ${cost} gold for ${label}.`;
    }
  };
  if (input.tap("1")) buy("sail", 90 + ship.upgrades.sail * 60, "Sails");
  if (input.tap("2")) buy("hull", 80 + ship.upgrades.hull * 60, "Hull");
  if (input.tap("3")) buy("rudder", 70 + ship.upgrades.rudder * 55, "Rudder");
  if (input.tap("4")) buy("diving", 100 + ship.upgrades.diving * 75, "Diving gear");
}

function updateObjective(state) {
  const pos = activePosition(state);
  const wreck = state.world.nearestWreck(pos);
  const port = state.world.nearestPort(state.ship);
  if (state.ship.hull <= 0) state.objective = "Your ship is crippled. Return to port for repairs or press R to reset.";
  else if (state.player.carrying) state.objective = "Carrying salvage. Swim to your ship and press E near the ladder.";
  else if (state.ship.cargo > 0) state.objective = "Cargo aboard. Sail to a port and press E/P to sell, then buy upgrades with 1-4.";
  else if (state.player.mode !== "helm" && wreck && wreck.distance < 40) state.objective = "Wreck nearby. Dive with Shift and press E at depth to recover salvage.";
  else if (port && port.distance < 58 && state.ship.gold >= 90) state.objective = "At port. Buy upgrades: 1 sails, 2 hull, 3 rudder, 4 diving gear.";
  else state.objective = "Explore the procedural isles. Cyan wrecks hold salvage. Pale reefs damage your hull.";
}

function updateCamera(state, input, dt) {
  if (input.tap("c")) {
    const modes = ["chase", "map", "first-person"];
    state.player.camera = modes[(modes.indexOf(state.player.camera) + 1) % modes.length];
    state.mapOpen = state.player.camera === "map";
  }
  if (input.tap("m")) {
    state.mapOpen = !state.mapOpen;
    state.player.camera = state.mapOpen ? "map" : "chase";
  }
  const pos = activePosition(state);
  const ship = state.ship;
  const zoomTarget = state.mapOpen ? 0.25 : state.player.camera === "first-person" ? 1.45 : 0.88;
  state.camera.zoom = lerp(state.camera.zoom, zoomTarget, 1 - Math.exp(-dt * 4));
  const lookAhead = state.player.camera === "first-person" ? 76 : 24;
  state.camera.x = lerp(state.camera.x, pos.x + Math.sin(ship.heading) * lookAhead, 1 - Math.exp(-dt * 3.1));
  state.camera.z = lerp(state.camera.z, pos.z - Math.cos(ship.heading) * lookAhead, 1 - Math.exp(-dt * 3.1));
  state.camera.angle = turnToward(state.camera.angle, ship.heading, 1 - Math.exp(-dt * 3));
}

export function updateBlackwakeState(state, input, dt, time) {
  if (input.tap("r")) Object.assign(state, createBlackwakeState({ seed: state.seed }));
  state.time = time;
  state.frame += 1;
  updateWorld(state, dt);
  if (state.player.mode === "helm") updateShip(state, input, dt);
  updatePlayer(state, input, dt);
  updatePorts(state, input);
  updateObjective(state);
  updateCamera(state, input, dt);
  input.finishFrame();
}
