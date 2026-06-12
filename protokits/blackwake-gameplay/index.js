import { createBlackwakeProtoKit } from "../blackwake-kit-registry/index.js";

export const BLACKWAKE_GAMEPLAY_VERSION = "0.1.0";

const TWO_PI = Math.PI * 2;
const DEFAULT_SEED = "blackwake-public-demo-001";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function angleLerp(a, b, t) {
  let delta = ((b - a + Math.PI) % TWO_PI) - Math.PI;
  if (delta < -Math.PI) delta += TWO_PI;
  return a + delta * t;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function hashString(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function createRng(seed) {
  let state = hashString(String(seed || DEFAULT_SEED)) || 1;
  return function rng() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createNoise(seed) {
  const base = hashString(seed);
  return function noise(x, z) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const h = hashString(`${base}:${xi}:${zi}`);
    return ((h & 0xffff) / 0xffff) * 2 - 1;
  };
}

function smoothNoise(noise, x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const s = xf * xf * (3 - 2 * xf);
  const t = zf * zf * (3 - 2 * zf);
  const a = noise(xi, zi);
  const b = noise(xi + 1, zi);
  const c = noise(xi, zi + 1);
  const d = noise(xi + 1, zi + 1);
  return lerp(lerp(a, b, s), lerp(c, d, s), t);
}

function createInput(target = globalThis) {
  const keys = new Set();
  const pressed = new Set();
  const onDown = (event) => {
    const key = event.key.toLowerCase();
    if (!keys.has(key)) pressed.add(key);
    keys.add(key);
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault?.();
  };
  const onUp = (event) => keys.delete(event.key.toLowerCase());
  target.addEventListener?.("keydown", onDown);
  target.addEventListener?.("keyup", onUp);
  return {
    keys,
    down(key) { return keys.has(key); },
    tap(key) {
      const hit = pressed.has(key);
      pressed.delete(key);
      return hit;
    },
    readAxis() {
      return {
        forward: (keys.has("w") || keys.has("arrowup") ? 1 : 0) - (keys.has("s") || keys.has("arrowdown") ? 1 : 0),
        turn: (keys.has("d") || keys.has("arrowright") ? 1 : 0) - (keys.has("a") || keys.has("arrowleft") ? 1 : 0),
        boost: keys.has("shift")
      };
    },
    finishFrame() { pressed.clear(); },
    destroy() {
      target.removeEventListener?.("keydown", onDown);
      target.removeEventListener?.("keyup", onUp);
    }
  };
}

function makeIsland(rng, index) {
  const ring = 320 + index * 118 + rng() * 80;
  const angle = index * 1.73 + rng() * 0.8;
  const radius = 70 + rng() * 85;
  const x = Math.cos(angle) * ring;
  const z = Math.sin(angle) * ring - 260;
  const hasPort = index === 0 || rng() > 0.62;
  const dockAngle = angle + Math.PI + (rng() - 0.5) * 1.2;
  const port = hasPort ? {
    x: x + Math.cos(dockAngle) * (radius + 18),
    z: z + Math.sin(dockAngle) * (radius + 18),
    name: index === 0 ? "Gullwake Port" : ["Marrow Quay", "Cinder Dock", "Pearl Anchorage", "Lowtide Market"][index % 4]
  } : null;
  const wreckAngle = angle + 1.1 + rng() * 1.7;
  const wreck = {
    id: `wreck-${index}`,
    x: x + Math.cos(wreckAngle) * (radius + 65 + rng() * 50),
    z: z + Math.sin(wreckAngle) * (radius + 65 + rng() * 50),
    taken: false,
    depth: 10 + rng() * 26,
    value: 45 + Math.floor(rng() * 90)
  };
  const reefs = Array.from({ length: 3 + Math.floor(rng() * 4) }, (_, reefIndex) => {
    const a = angle + reefIndex * 1.2 + rng() * 0.8;
    const d = radius + 34 + rng() * 56;
    return { id: `reef-${index}-${reefIndex}`, x: x + Math.cos(a) * d, z: z + Math.sin(a) * d, r: 16 + rng() * 18 };
  });
  return { id: `island-${index}`, name: ["Gullwake", "Cinder Cay", "Pearlhook", "Old Marrow", "Stormglass", "Knife Atoll", "Sable Tooth", "Crownreef"][index % 8], x, z, radius, hasPort, port, wreck, reefs, discovered: index === 0 };
}

function createWorld(seed) {
  const rng = createRng(seed);
  const noise = createNoise(seed);
  const islands = Array.from({ length: 9 }, (_, index) => makeIsland(rng, index));
  const start = islands[0].port ?? { x: 0, z: 0, name: "Gullwake Port" };
  return {
    seed,
    rng,
    noise,
    islands,
    wind: { angle: -0.45, speed: 0.62 },
    storm: { intensity: 0.12, target: 0.18, lightning: 0 },
    start,
    sampleOcean(x, z, time) {
      const swell = Math.sin((x * 0.018 + z * 0.011) + time * 0.75) * 0.9;
      const cross = Math.sin((x * -0.031 + z * 0.022) + time * 1.15) * 0.35;
      const chop = smoothNoise(noise, x * 0.018 + time * 0.08, z * 0.018) * 0.28;
      const stormScale = 1 + this.storm.intensity * 1.8;
      return (swell + cross + chop) * stormScale;
    },
    currentAt(x, z, time) {
      return {
        x: Math.sin(z * 0.003 + time * 0.08) * 0.08,
        z: Math.cos(x * 0.003 - time * 0.06) * 0.08
      };
    },
    nearestPort(position) {
      let best = null;
      for (const island of islands) {
        if (!island.port) continue;
        const d = Math.hypot(position.x - island.port.x, position.z - island.port.z);
        if (!best || d < best.distance) best = { island, port: island.port, distance: d };
      }
      return best;
    },
    nearestWreck(position) {
      let best = null;
      for (const island of islands) {
        const d = Math.hypot(position.x - island.wreck.x, position.z - island.wreck.z);
        if (!best || d < best.distance) best = { island, wreck: island.wreck, distance: d };
      }
      return best;
    }
  };
}

function createHud(root = document.body) {
  const hud = document.createElement("section");
  hud.setAttribute("aria-label", "Blackwake gameplay status");
  hud.style.cssText = "position:fixed;left:16px;top:16px;z-index:10;width:min(520px,calc(100vw - 32px));padding:14px 16px;border:1px solid rgba(177,229,255,.24);border-radius:14px;background:rgba(2,8,18,.64);backdrop-filter:blur(14px);box-shadow:0 22px 80px rgba(0,0,0,.42);color:#ecfbff;font-family:Inter,ui-sans-serif,system-ui,sans-serif;pointer-events:none";
  hud.innerHTML = `
    <h1 style="margin:0 0 6px;font-size:15px;letter-spacing:.08em;text-transform:uppercase">Blackwake Isles</h1>
    <p data-objective style="margin:0 0 10px;color:rgba(236,251,255,.78);font-size:13px;line-height:1.4">Booting ProtoKits...</p>
    <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px">
      <b data-speed style="padding:7px;border:1px solid rgba(177,229,255,.14);border-radius:9px;background:rgba(255,255,255,.055);font-size:12px">0 kn</b>
      <b data-mode style="padding:7px;border:1px solid rgba(177,229,255,.14);border-radius:9px;background:rgba(255,255,255,.055);font-size:12px">helm</b>
      <b data-hull style="padding:7px;border:1px solid rgba(177,229,255,.14);border-radius:9px;background:rgba(255,255,255,.055);font-size:12px">Hull 100%</b>
      <b data-gold style="padding:7px;border:1px solid rgba(177,229,255,.14);border-radius:9px;background:rgba(255,255,255,.055);font-size:12px">Gold 0</b>
      <b data-cargo style="padding:7px;border:1px solid rgba(177,229,255,.14);border-radius:9px;background:rgba(255,255,255,.055);font-size:12px">Cargo 0</b>
    </div>
    <p data-help style="margin:10px 0 0;color:rgba(236,251,255,.62);font-size:12px;line-height:1.35">WASD steer/sail. E interact. F leave helm/jump. C camera. M map. Space anchor. Shift boost/swim dive.</p>
  `;
  root.append(hud);
  return {
    root: hud,
    objective: hud.querySelector("[data-objective]"),
    speed: hud.querySelector("[data-speed]"),
    mode: hud.querySelector("[data-mode]"),
    hull: hud.querySelector("[data-hull]"),
    gold: hud.querySelector("[data-gold]"),
    cargo: hud.querySelector("[data-cargo]"),
    help: hud.querySelector("[data-help]"),
    destroy() { hud.remove(); }
  };
}

function createState(options) {
  const world = createWorld(options.seed || DEFAULT_SEED);
  const ship = {
    x: world.start.x,
    z: world.start.z + 48,
    heading: -Math.PI / 2,
    velocity: 0,
    sail: 0,
    rudder: 0,
    anchor: false,
    hull: 100,
    cargo: 0,
    cargoValue: 0,
    gold: 40,
    upgrades: { sail: 0, hull: 0, rudder: 0, diving: 0 },
    wake: []
  };
  const player = {
    mode: "helm",
    camera: "chase",
    x: ship.x,
    z: ship.z,
    depth: 0,
    oxygen: 100,
    carrying: null
  };
  return {
    id: "blackwake-playable-state",
    seed: options.seed || DEFAULT_SEED,
    time: 0,
    frame: 0,
    paused: false,
    world,
    ship,
    player,
    mapOpen: false,
    message: "Sail out of Gullwake Port and find the marked wreck.",
    objective: "Sail to the cyan wreck marker, jump overboard, dive, salvage cargo, then return to port for upgrades.",
    quest: { phase: "sail-to-wreck", target: world.islands[1].wreck.id, completedWrecks: 0, delivered: 0 },
    camera: { x: ship.x, z: ship.z, zoom: 1, angle: ship.heading },
    particles: [],
    stats: { reefHits: 0, salvaged: 0, portsVisited: 0, upgradesBought: 0 }
  };
}

function activePosition(state) {
  return state.player.mode === "swim" || state.player.mode === "dive" ? state.player : state.ship;
}

function addParticle(state, particle) {
  if (state.particles.length > 420) state.particles.shift();
  state.particles.push(particle);
}

function updateShip(state, input, dt) {
  const { ship, world } = state;
  const axis = input.readAxis();
  const windAngle = world.wind.angle;
  const windDot = Math.max(0.18, 0.35 + Math.cos(ship.heading - windAngle) * 0.65);
  const sailPower = 8.5 + ship.upgrades.sail * 2.4;
  const rudderPower = 0.85 + ship.upgrades.rudder * 0.22;
  const hullDrag = 0.32 - ship.upgrades.hull * 0.035;

  if (input.tap(" ")) ship.anchor = !ship.anchor;
  ship.sail = clamp(ship.sail + axis.forward * dt * 0.55, -0.28, 1);
  if (axis.boost && ship.sail > 0.35) ship.sail = clamp(ship.sail + dt * 0.3, 0, 1.2);
  ship.rudder = lerp(ship.rudder, axis.turn, 1 - Math.exp(-dt * 5));

  const current = world.currentAt(ship.x, ship.z, state.time);
  const force = ship.sail * sailPower * windDot;
  ship.velocity += force * dt;
  ship.velocity *= Math.exp(-dt * (ship.anchor ? 2.8 : hullDrag));
  ship.velocity = clamp(ship.velocity, -3, 17 + ship.upgrades.sail * 3);
  ship.heading += ship.rudder * rudderPower * dt * (0.35 + Math.abs(ship.velocity) * 0.055) * Math.sign(ship.velocity || 1);
  ship.x += Math.sin(ship.heading) * ship.velocity * dt + current.x * dt * 8;
  ship.z -= Math.cos(ship.heading) * ship.velocity * dt + current.z * dt * 8;

  if (Math.abs(ship.velocity) > 2 && state.frame % 2 === 0) {
    ship.wake.push({ x: ship.x - Math.sin(ship.heading) * 14, z: ship.z + Math.cos(ship.heading) * 14, age: 0, life: 1.9, size: 8 + Math.abs(ship.velocity) * 1.2 });
    if (ship.wake.length > 90) ship.wake.shift();
  }

  for (const wake of ship.wake) wake.age += dt;
  ship.wake = ship.wake.filter((wake) => wake.age < wake.life);

  for (const island of world.islands) {
    for (const reef of island.reefs) {
      const d = Math.hypot(ship.x - reef.x, ship.z - reef.z);
      if (d < reef.r && Math.abs(ship.velocity) > 1.8) {
        const damage = (1 + Math.abs(ship.velocity) * 0.08) * dt * 18;
        ship.hull = clamp(ship.hull - damage, 0, 100);
        ship.velocity *= Math.exp(-dt * 4);
        state.stats.reefHits += dt;
        addParticle(state, { kind: "sparks", x: ship.x, z: ship.z, age: 0, life: 0.7 });
        state.message = "Reef strike! Slow down in shallow water.";
      }
    }
  }
}

function updatePlayer(state, input, dt) {
  const { player, ship, world } = state;
  const axis = input.readAxis();
  if (player.mode === "helm") {
    player.x = ship.x;
    player.z = ship.z;
    player.depth = 0;
    if (input.tap("f")) {
      player.mode = "deck";
      state.message = "You are on deck. Press E at the helm or F to jump overboard.";
    }
    return;
  }

  if (player.mode === "deck") {
    player.x = ship.x + Math.cos(ship.heading) * 8;
    player.z = ship.z + Math.sin(ship.heading) * 8;
    player.depth = 0;
    if (input.tap("e")) {
      player.mode = "helm";
      state.message = "Back at the helm.";
    }
    if (input.tap("f")) {
      player.mode = "swim";
      player.x = ship.x + Math.sin(ship.heading) * 18;
      player.z = ship.z - Math.cos(ship.heading) * 18;
      state.message = "Overboard. Swim to wrecks or return to the ladder.";
    }
    return;
  }

  if (player.mode === "swim" || player.mode === "dive") {
    const speed = player.mode === "dive" ? 34 : 42;
    const forward = axis.forward;
    const turn = axis.turn;
    player.x += turn * speed * dt;
    player.z -= forward * speed * dt;
    const current = world.currentAt(player.x, player.z, state.time);
    player.x += current.x * dt * 12;
    player.z += current.z * dt * 12;
    if (axis.boost || input.down("shift")) {
      player.mode = "dive";
      player.depth = clamp(player.depth + dt * 9, 0, 34 + ship.upgrades.diving * 12);
    } else if (input.down(" ")) {
      player.depth = clamp(player.depth - dt * 16, 0, 60);
      if (player.depth <= 0.2) player.mode = "swim";
    }
    if (player.mode === "dive" || player.depth > 1) {
      player.oxygen = clamp(player.oxygen - dt * (4.2 - ship.upgrades.diving * 0.6), 0, 100);
      if (state.frame % 8 === 0) addParticle(state, { kind: "bubble", x: player.x, z: player.z, age: 0, life: 1.2 });
      if (player.oxygen <= 0) {
        ship.hull = clamp(ship.hull - dt * 4, 0, 100);
        state.message = "Out of air. Surface or reach the ladder.";
      }
    } else {
      player.oxygen = clamp(player.oxygen + dt * 14, 0, 100);
    }
    if (dist(player, ship) < 24 && input.tap("e")) {
      player.mode = "deck";
      player.depth = 0;
      player.oxygen = 100;
      if (player.carrying) {
        ship.cargo += 1;
        ship.cargoValue += player.carrying.value;
        state.message = `Cargo secured aboard: ${player.carrying.name}. Return to port to sell or upgrade.`;
        player.carrying = null;
      } else {
        state.message = "Climbed back aboard.";
      }
    }
    const nearby = world.nearestWreck(player);
    if (nearby && nearby.distance < 20 && player.depth > 6 && input.tap("e")) {
      if (!nearby.wreck.taken) {
        nearby.wreck.taken = true;
        player.carrying = { name: `${nearby.island.name} relic crate`, value: nearby.wreck.value };
        state.stats.salvaged += 1;
        state.quest.completedWrecks += 1;
        state.quest.phase = "return-to-port";
        state.objective = "Return to any port, climb aboard, dock, and sell the salvage for ship upgrades.";
        state.message = "Relic crate recovered. Swim back to your ship and press E near the ladder.";
      } else {
        state.message = "This wreck has already been stripped.";
      }
    }
  }
}

function updatePortsAndProgression(state, input) {
  const { ship, world } = state;
  const port = world.nearestPort(ship);
  if (!port || port.distance > 46) return;
  port.island.discovered = true;
  if (input.tap("e") || input.tap("p")) {
    state.stats.portsVisited += 1;
    if (ship.cargoValue > 0) {
      ship.gold += ship.cargoValue;
      state.quest.delivered += ship.cargo;
      state.message = `Sold salvage at ${port.port.name} for ${ship.cargoValue} gold.`;
      ship.cargo = 0;
      ship.cargoValue = 0;
    } else {
      state.message = `${port.port.name}: Press 1 sail, 2 hull, 3 rudder, 4 diving upgrade.`;
    }
    state.quest.phase = ship.gold >= 90 ? "upgrade-ship" : "find-more-salvage";
  }
  const buy = (slot, cost, label) => {
    if (ship.gold >= cost) {
      ship.gold -= cost;
      ship.upgrades[slot] += 1;
      state.stats.upgradesBought += 1;
      state.message = `${label} upgraded. Find harder wrecks and storm routes.`;
      state.quest.phase = "explore-isles";
    } else {
      state.message = `Need ${cost} gold for ${label}.`;
    }
  };
  if (input.tap("1")) buy("sail", 90 + ship.upgrades.sail * 60, "Sails");
  if (input.tap("2")) buy("hull", 80 + ship.upgrades.hull * 60, "Hull");
  if (input.tap("3")) buy("rudder", 70 + ship.upgrades.rudder * 50, "Rudder");
  if (input.tap("4")) buy("diving", 100 + ship.upgrades.diving * 75, "Diving gear");
}

function updateQuest(state) {
  const { ship, world, player } = state;
  const wreck = world.nearestWreck(activePosition(state));
  const port = world.nearestPort(ship);
  if (ship.hull <= 0) {
    state.objective = "Your ship is crippled. Limp back to port for repairs or restart the run.";
    return;
  }
  if (player.mode === "helm" && wreck && !wreck.wreck.taken && wreck.distance < 130) {
    state.objective = "Wreck nearby. Leave the helm with F, jump overboard with F, dive with Shift, press E at the wreck.";
  } else if (player.carrying) {
    state.objective = "Carrying salvage. Return to your ship ladder and press E to bring it aboard.";
  } else if (ship.cargo > 0) {
    state.objective = "Cargo aboard. Sail to a port and press E/P to sell it, then buy upgrades with 1-4.";
  } else if (port && port.distance < 60 && ship.gold >= 90) {
    state.objective = "At port. Buy upgrades: 1 sails, 2 hull, 3 rudder, 4 diving gear.";
  } else {
    state.objective = "Explore the procedural isles. Cyan wrecks contain salvage. Ports sell upgrades. Reefs damage hull.";
  }
}

function updateCamera(state, input, dt) {
  const target = activePosition(state);
  const ship = state.ship;
  if (input.tap("c")) {
    const order = ["chase", "map", "first-person"];
    const next = order[(order.indexOf(state.player.camera) + 1) % order.length];
    state.player.camera = next;
    state.mapOpen = next === "map";
  }
  if (input.tap("m")) {
    state.mapOpen = !state.mapOpen;
    state.player.camera = state.mapOpen ? "map" : "chase";
  }
  const zoomTarget = state.mapOpen ? 0.28 : state.player.camera === "first-person" ? 1.45 : 0.9;
  state.camera.zoom = lerp(state.camera.zoom, zoomTarget, 1 - Math.exp(-dt * 4));
  const lookAhead = state.player.camera === "first-person" ? 72 : 22;
  const tx = target.x + Math.sin(ship.heading) * lookAhead;
  const tz = target.z - Math.cos(ship.heading) * lookAhead;
  state.camera.x = lerp(state.camera.x, tx, 1 - Math.exp(-dt * 3.2));
  state.camera.z = lerp(state.camera.z, tz, 1 - Math.exp(-dt * 3.2));
  state.camera.angle = angleLerp(state.camera.angle, ship.heading, 1 - Math.exp(-dt * 3));
}

function updateWorld(state, dt) {
  state.world.storm.target = state.quest.completedWrecks > 1 ? 0.72 : state.quest.completedWrecks > 0 ? 0.36 : 0.18;
  state.world.storm.intensity = lerp(state.world.storm.intensity, state.world.storm.target, 1 - Math.exp(-dt * 0.15));
  state.world.storm.lightning = Math.max(0, state.world.storm.lightning - dt * 2);
  if (state.world.storm.intensity > 0.45 && state.world.rng() < dt * state.world.storm.intensity * 0.18) {
    state.world.storm.lightning = 1;
  }
  for (const particle of state.particles) particle.age += dt;
  state.particles = state.particles.filter((particle) => particle.age < particle.life);
}

function updateState(state, input, dt, time) {
  state.time = time;
  state.frame += 1;
  if (input.tap("r")) {
    Object.assign(state, createState({ seed: state.seed }));
    return;
  }
  updateWorld(state, dt);
  if (state.player.mode === "helm") updateShip(state, input, dt);
  updatePlayer(state, input, dt);
  updatePortsAndProgression(state, input);
  updateQuest(state);
  updateCamera(state, input, dt);
  input.finishFrame();
}

function createRenderer(canvas, state) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Blackwake Isles requires a 2D canvas context.");
  let dpr = 1;
  function resize() {
    dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr || globalThis.innerWidth * dpr || 1280));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr || globalThis.innerHeight * dpr || 720));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }
  globalThis.addEventListener?.("resize", resize);

  function worldToScreen(x, z) {
    const scale = state.camera.zoom * dpr;
    const dx = x - state.camera.x;
    const dz = z - state.camera.z;
    if (state.player.camera === "first-person") {
      const ca = Math.cos(-state.camera.angle);
      const sa = Math.sin(-state.camera.angle);
      const rx = dx * ca - dz * sa;
      const rz = dx * sa + dz * ca;
      return { x: canvas.width / 2 + rx * scale, y: canvas.height * 0.62 + rz * scale * 0.72 };
    }
    return { x: canvas.width / 2 + dx * scale, y: canvas.height / 2 + dz * scale };
  }

  function drawWater() {
    const storm = state.world.storm.intensity;
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, `rgb(${Math.round(12 + storm * 10)},${Math.round(54 - storm * 18)},${Math.round(88 - storm * 24)})`);
    grad.addColorStop(1, `rgb(${Math.round(2)},${Math.round(12 - storm * 4)},${Math.round(24 - storm * 8)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const spacing = 28 * dpr / Math.max(0.45, state.camera.zoom);
    ctx.lineWidth = 1 * dpr;
    for (let y = -spacing; y < canvas.height + spacing; y += spacing) {
      ctx.beginPath();
      for (let x = -spacing; x < canvas.width + spacing; x += spacing) {
        const wx = state.camera.x + (x - canvas.width / 2) / (state.camera.zoom * dpr);
        const wz = state.camera.z + (y - canvas.height / 2) / (state.camera.zoom * dpr);
        const h = state.world.sampleOcean(wx, wz, state.time);
        const yy = y + h * 3 * dpr;
        if (x < 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = `rgba(180,235,255,${0.07 + storm * 0.05})`;
      ctx.stroke();
    }
    if (state.world.storm.lightning > 0) {
      ctx.fillStyle = `rgba(210,235,255,${state.world.storm.lightning * 0.28})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function drawIsland(island) {
    const s = worldToScreen(island.x, island.z);
    const r = island.radius * state.camera.zoom * dpr;
    if (s.x < -r || s.x > canvas.width + r || s.y < -r || s.y > canvas.height + r) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.fillStyle = "rgba(230,204,128,.95)";
    ctx.beginPath();
    for (let i = 0; i < 18; i += 1) {
      const a = i / 18 * TWO_PI;
      const wobble = 0.78 + 0.18 * Math.sin(i * 1.9 + island.x * 0.01);
      const rr = r * wobble;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr * 0.78;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(42,108,56,.9)";
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.04, r * 0.62, r * 0.44, 0, 0, TWO_PI);
    ctx.fill();
    if (island.port) {
      const p = worldToScreen(island.port.x, island.port.z);
      ctx.restore();
      ctx.fillStyle = "rgba(255,210,112,.95)";
      ctx.beginPath(); ctx.arc(p.x, p.y, 6 * dpr, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.82)";
      ctx.font = `${11 * dpr}px system-ui`;
      ctx.fillText(island.port.name, p.x + 8 * dpr, p.y - 8 * dpr);
      return;
    }
    ctx.restore();
  }

  function drawWorldObjects() {
    for (const island of state.world.islands) {
      drawIsland(island);
      for (const reef of island.reefs) {
        const p = worldToScreen(reef.x, reef.z);
        const rr = reef.r * state.camera.zoom * dpr;
        ctx.strokeStyle = "rgba(180,250,255,.55)";
        ctx.fillStyle = "rgba(120,220,210,.12)";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, TWO_PI); ctx.fill(); ctx.stroke();
      }
      const w = island.wreck;
      if (!w.taken) {
        const p = worldToScreen(w.x, w.z);
        ctx.strokeStyle = "rgba(75,236,255,.9)";
        ctx.fillStyle = "rgba(75,236,255,.13)";
        ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.arc(p.x, p.y, 12 * dpr, 0, TWO_PI); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(200,250,255,.9)";
        ctx.font = `${11 * dpr}px system-ui`;
        ctx.fillText("wreck", p.x + 14 * dpr, p.y + 4 * dpr);
      }
    }
  }

  function drawShip() {
    const { ship } = state;
    for (const wake of ship.wake) {
      const p = worldToScreen(wake.x, wake.z);
      const alpha = 1 - wake.age / wake.life;
      ctx.strokeStyle = `rgba(232,252,255,${alpha * 0.45})`;
      ctx.lineWidth = wake.size * dpr * state.camera.zoom;
      ctx.beginPath(); ctx.arc(p.x, p.y, wake.size * dpr * state.camera.zoom * (1 + wake.age), 0, TWO_PI); ctx.stroke();
    }
    const s = worldToScreen(ship.x, ship.z);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(ship.heading);
    const scale = dpr * state.camera.zoom;
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(3 * scale, 8 * scale, 12 * scale, 32 * scale, 0, 0, TWO_PI); ctx.fill();
    ctx.fillStyle = ship.hull > 28 ? "#d9e2df" : "#a45b4d";
    ctx.strokeStyle = "#203743";
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, -34 * scale);
    ctx.quadraticCurveTo(18 * scale, -8 * scale, 12 * scale, 28 * scale);
    ctx.quadraticCurveTo(0, 38 * scale, -12 * scale, 28 * scale);
    ctx.quadraticCurveTo(-18 * scale, -8 * scale, 0, -34 * scale);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "rgba(210,245,255,.75)";
    ctx.fillRect(-4 * scale, -11 * scale, 8 * scale, 22 * scale);
    ctx.strokeStyle = "rgba(255,244,190,.86)";
    ctx.beginPath(); ctx.moveTo(0, -18 * scale); ctx.lineTo(Math.sin(ship.sail) * 18 * scale, 10 * scale); ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    const { player } = state;
    if (player.mode !== "swim" && player.mode !== "dive") return;
    const p = worldToScreen(player.x, player.z);
    ctx.fillStyle = player.mode === "dive" ? "rgba(180,245,255,.95)" : "rgba(255,230,180,.95)";
    ctx.beginPath(); ctx.arc(p.x, p.y, 5 * dpr, 0, TWO_PI); ctx.fill();
    if (player.carrying) {
      ctx.strokeStyle = "rgba(255,220,95,.9)";
      ctx.strokeRect(p.x + 7 * dpr, p.y - 5 * dpr, 8 * dpr, 8 * dpr);
    }
  }

  function drawParticles() {
    for (const particle of state.particles) {
      const p = worldToScreen(particle.x, particle.z);
      const a = 1 - particle.age / particle.life;
      ctx.fillStyle = particle.kind === "bubble" ? `rgba(210,250,255,${a * 0.55})` : `rgba(255,210,130,${a * 0.6})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, (particle.kind === "bubble" ? 3 : 5) * dpr, 0, TWO_PI); ctx.fill();
    }
  }

  function drawUnderwaterOverlay() {
    if (state.player.mode !== "dive") return;
    ctx.fillStyle = `rgba(0,70,110,${0.22 + clamp(state.player.depth / 80, 0, 0.35)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(160,235,255,.12)";
    for (let i = 0; i < 12; i += 1) {
      const y = ((i * 71 + state.time * 42) % canvas.height);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(canvas.width * 0.25, y - 22, canvas.width * 0.72, y + 24, canvas.width, y - 10); ctx.stroke();
    }
  }

  function drawMapOverlay() {
    if (!state.mapOpen) return;
    ctx.fillStyle = "rgba(2,6,12,.42)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(236,251,255,.84)";
    ctx.font = `${13 * dpr}px system-ui`;
    ctx.fillText("Map mode: islands, ports, reefs, and wrecks are deterministic from the seed.", 18 * dpr, canvas.height - 24 * dpr);
  }

  function drawHudCanvas() {
    const port = state.world.nearestPort(state.ship);
    const wreck = state.world.nearestWreck(activePosition(state));
    ctx.fillStyle = "rgba(236,251,255,.78)";
    ctx.font = `${12 * dpr}px system-ui`;
    const lines = [
      port ? `Nearest port: ${port.port.name} ${Math.round(port.distance)}m` : "No port nearby",
      wreck ? `Nearest wreck: ${wreck.island.name} ${Math.round(wreck.distance)}m` : "No wreck nearby",
      `Wind: ${Math.round(state.world.wind.speed * 100)}%  Storm: ${Math.round(state.world.storm.intensity * 100)}%  Oxygen: ${Math.round(state.player.oxygen)}%`
    ];
    lines.forEach((line, i) => ctx.fillText(line, 18 * dpr, canvas.height - (58 - i * 16) * dpr));
  }

  function render() {
    resize();
    drawWater();
    drawWorldObjects();
    drawParticles();
    drawShip();
    drawPlayer();
    drawUnderwaterOverlay();
    drawMapOverlay();
    drawHudCanvas();
  }

  return { render, destroy() { globalThis.removeEventListener?.("resize", resize); } };
}

function updateHud(hud, state) {
  if (!hud) return;
  hud.objective.textContent = state.objective;
  hud.speed.textContent = `${Math.abs(state.ship.velocity * 1.94).toFixed(1)} kn`;
  hud.mode.textContent = state.player.camera === "first-person" ? `${state.player.mode} / fp` : state.mapOpen ? `${state.player.mode} / map` : state.player.mode;
  hud.hull.textContent = `Hull ${Math.round(state.ship.hull)}%`;
  hud.gold.textContent = `Gold ${state.ship.gold}`;
  hud.cargo.textContent = `Cargo ${state.ship.cargo}`;
  hud.help.textContent = state.message;
}

function createGameplayRuntimeKit(NexusRealtime, runtime, id) {
  if (typeof NexusRealtime?.defineRuntimeKit !== "function" || typeof NexusRealtime?.defineResource !== "function" || typeof NexusRealtime?.defineEvent !== "function") {
    return null;
  }
  const State = NexusRealtime.defineResource(`${id}:state`);
  const Ticked = NexusRealtime.defineEvent(`${id}:ticked`);
  const PhaseChanged = NexusRealtime.defineEvent(`${id}:phase-changed`);
  return NexusRealtime.defineRuntimeKit({
    id: `${id}:playable-runtime`,
    provides: [`gameplay:${id}`, "gameplay:blackwake-playable"],
    resources: { State },
    events: { Ticked, PhaseChanged },
    systems: [{
      phase: "simulate",
      name: `${id}:playable-update`,
      system(world) {
        const state = world.getResource(State);
        const previousPhase = state.quest.phase;
        runtime.update(world.__nexusClock?.delta ?? 1 / 60, world.__nexusClock?.elapsed ?? state.time);
        if (state.quest.phase !== previousPhase) world.emit(PhaseChanged, { previousPhase, nextPhase: state.quest.phase });
        world.emit(Ticked, { frame: state.frame, mode: state.player.mode, phase: state.quest.phase });
        runtime.updatedByEngineFrame = world.__nexusClock?.frame ?? runtime.updatedByEngineFrame;
      }
    }],
    initWorld({ world }) {
      world.setResource(State, runtime.state);
    },
    bindings: {
      blackwakePlayableState: runtime.state,
      blackwakePlayableRuntime: runtime
    },
    metadata: {
      protoKit: id,
      tier: "gameplay",
      status: "playable"
    }
  });
}

export function createBlackwakePlayableGame(NexusRealtime, gameId = "blackwake-game-isles", options = {}) {
  const canvas = options.canvas;
  if (!canvas) throw new Error("createBlackwakePlayableGame requires a canvas.");
  const input = options.input || createInput(options.inputTarget || globalThis);
  const state = createState(options);
  const renderer = createRenderer(canvas, state);
  const hud = options.hud === false ? null : createHud(options.hudRoot || document.body);
  const runtime = {
    state,
    updatedByEngineFrame: -1,
    update(delta, time) {
      updateState(state, input, delta, time);
      updateHud(hud, state);
      options.onUpdate?.({ state, delta, time });
    },
    render() {
      renderer.render();
      options.onRender?.({ state });
    },
    destroy() {
      input.destroy?.();
      renderer.destroy?.();
      hud?.destroy();
    }
  };

  const registryProtoKit = createBlackwakeProtoKit(NexusRealtime, gameId, { status: "playable-scaffold", ...(options.protoKitOptions ?? {}) });
  const gameplayKit = createGameplayRuntimeKit(NexusRealtime, runtime, gameId);
  const kits = gameplayKit ? [...registryProtoKit.kits, gameplayKit] : registryProtoKit.kits;
  const engine = typeof NexusRealtime?.createRealtimeGame === "function"
    ? NexusRealtime.createRealtimeGame({ ...(options.engine ?? {}), canvas, kits })
    : null;

  let running = false;
  let last = 0;
  function frame(now) {
    if (!running) return;
    const delta = Math.min(options.maxDelta ?? 0.033, (now - last) / 1000 || 1 / 60);
    last = now;
    if (engine?.tick) {
      const before = runtime.updatedByEngineFrame;
      engine.tick(delta);
      if (runtime.updatedByEngineFrame === before) runtime.update(delta, state.time + delta);
    } else {
      runtime.update(delta, state.time + delta);
    }
    runtime.render();
    globalThis.requestAnimationFrame?.(frame);
  }

  return Object.freeze({
    id: gameId,
    version: BLACKWAKE_GAMEPLAY_VERSION,
    protoKit: Object.freeze({ ...registryProtoKit, kits: Object.freeze(kits), installOrder: Object.freeze(kits.map((kit) => kit.id)) }),
    engine,
    state,
    runtime,
    start() {
      if (running) return;
      running = true;
      last = globalThis.performance?.now?.() ?? 0;
      globalThis.requestAnimationFrame?.(frame);
    },
    stop() { running = false; },
    tick(delta = 1 / 60) {
      if (engine?.tick) engine.tick(delta); else runtime.update(delta, state.time + delta);
      runtime.render();
    },
    destroy() {
      running = false;
      runtime.destroy();
    }
  });
}

export function createBlackwakeIslesGame(NexusRealtime, options = {}) {
  return createBlackwakePlayableGame(NexusRealtime, "blackwake-game-isles", options);
}

export function createStormlineRescueGame(NexusRealtime, options = {}) {
  return createBlackwakePlayableGame(NexusRealtime, "blackwake-game-stormline-rescue", {
    seed: "stormline-rescue-vertical-slice",
    ...options
  });
}

export function createBlackwakeIslesProtoKit(NexusRealtime, options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, "blackwake-game-isles", { status: "playable", ...options });
}

export function createStormlineRescueProtoKit(NexusRealtime, options = {}) {
  return createBlackwakeProtoKit(NexusRealtime, "blackwake-game-stormline-rescue", { status: "playable", ...options });
}
