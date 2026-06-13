export const NEXT_LEDGE_GRAPPLE_KIT_VERSION = "0.2.0";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const hypot = (x, y) => Math.hypot(Number(x) || 0, Number(y) || 0);
const copy = (value) => JSON.parse(JSON.stringify(value));

function seeded(seedText = "next-ledge") {
  let seed = 2166136261;
  for (const ch of String(seedText)) {
    seed ^= ch.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createDefaultNextLedgeGrappleConfig(config = {}) {
  return {
    seed: config.seed ?? "next-ledge-grapple",
    sector: Number(config.sector ?? 1),
    ropeLength: Number(config.ropeLength ?? 52),
    maxCableLength: Number(config.maxCableLength ?? 150),
    staminaMax: Number(config.staminaMax ?? 100),
    boundary: Number(config.boundary ?? 166),
    gravity: Number(config.gravity ?? 54),
    launchSpeed: Number(config.launchSpeed ?? 560),
    summitBase: Number(config.summitBase ?? 2200),
    summitStep: Number(config.summitStep ?? 700)
  };
}

export function generateNextLedgeGrappleRoute(config = {}) {
  const cfg = createDefaultNextLedgeGrappleConfig(config);
  const rand = seeded(`${cfg.seed}:${cfg.sector}`);
  const summitY = cfg.summitBase + cfg.sector * cfg.summitStep;
  const ledges = [{ id: "start", index: 0, x: 0, y: 0, r: 7, type: "normal", label: "Start anchor" }];
  let y = 76;
  let index = 1;
  while (y < summitY - 130) {
    const nodes = 2 + Math.floor(rand() * 2);
    for (let i = 0; i < nodes; i += 1) {
      const x = clamp(-105 + i * (210 / Math.max(1, nodes - 1)) + (rand() - 0.5) * 34, -145, 145);
      const ly = y + (rand() - 0.5) * 20;
      const rest = index % 7 === 0 || rand() < 0.15;
      ledges.push({ id: `ledge-${index}`, index, x, y: ly, r: rest ? 7 : 4.4, type: rest ? "rest" : "normal", label: rest ? "Rest relay" : "Anchor relay" });
      index += 1;
    }
    y += 98 + rand() * 42;
  }
  ledges.push({ id: "summit", index, x: 0, y: summitY, r: 14, type: "summit", label: "Summit relay" });
  return { id: `next-ledge-sector-${cfg.sector}`, seed: cfg.seed, sector: cfg.sector, summitY, ledges };
}

export function createDefaultNextLedgeGrappleLevel(config = {}) {
  return generateNextLedgeGrappleRoute(config);
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq <= 0.0001) return hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / lenSq, 0, 1);
  return hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function ropePoints(a, b, sag = 0, count = 12) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const t = i / (count - 1);
    points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t - Math.sin(Math.PI * t) * sag, z: 1 });
  }
  return points;
}

function createState(config, level) {
  const start = level.ledges[0];
  const ropeLength = Number(config.ropeLength ?? 52);
  return {
    version: NEXT_LEDGE_GRAPPLE_KIT_VERSION,
    mode: "swinging",
    status: "Hold A/D to swing, then click or press Space to release.",
    sector: level.sector ?? 1,
    alive: true,
    completed: false,
    level,
    ledges: level.ledges,
    stamina: Number(config.staminaMax ?? 100),
    staminaMax: Number(config.staminaMax ?? 100),
    gravity: Number(config.gravity ?? 54) + Number(level.sector ?? 1) * 2.8,
    wind: Math.max(0, Number(level.sector ?? 1) - 1) * 9,
    elapsed: 0,
    maxHeight: 0,
    currentLedgeId: start.id,
    lastLedgeId: start.id,
    anchor: { x: start.x, y: start.y, id: start.id, type: start.type },
    player: { x: start.x, y: start.y - ropeLength, vx: 0, vy: 0, angle: 0, aVel: 0, squash: 1 },
    probe: { visible: false, x: 0, y: 0, vx: 0, vy: 0, age: 0 },
    aim: { x: 0.35, y: 0.94 },
    axis: 0,
    ropeLength,
    reelLength: ropeLength,
    maxCableLength: Number(config.maxCableLength ?? 150),
    boundary: Number(config.boundary ?? 166),
    recentCue: null,
    stats: { launches: 0, catches: 0, falls: 0, rests: 0 }
  };
}

function normalizeAim(x, y) {
  const d = hypot(x, y) || 1;
  return { x: clamp(x / d, -1, 1), y: clamp(y / d, -1, 1) };
}

export function createNextLedgeGrappleKit(NexusRealtime, config = {}) {
  const required = ["defineResource", "defineEvent", "defineRuntimeKit"];
  for (const key of required) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createNextLedgeGrappleKit requires NexusRealtime.${key}.`);
  }
  const { defineResource, defineEvent, defineRuntimeKit } = NexusRealtime;
  const cfg = createDefaultNextLedgeGrappleConfig(config);
  let level = config.level ?? createDefaultNextLedgeGrappleLevel(cfg);

  const NextLedgeGrappleState = defineResource("nextLedgeGrapple.state");
  const NextLedgeGrappleAction = defineEvent("nextLedgeGrapple.action");
  const NextLedgeGrappleAim = defineEvent("nextLedgeGrapple.aim");
  const NextLedgeGrappleAxis = defineEvent("nextLedgeGrapple.axis");
  const NextLedgeGrappleRestart = defineEvent("nextLedgeGrapple.restart");
  const NextLedgeGrappleAdvanceSector = defineEvent("nextLedgeGrapple.advanceSector");
  const NextLedgeGrappleCue = defineEvent("nextLedgeGrapple.cue");

  function restart(sector = level.sector ?? cfg.sector) {
    level = createDefaultNextLedgeGrappleLevel({ ...cfg, sector });
    return createState({ ...cfg, sector }, level);
  }
  function emitCue(world, state, type, payload = {}) {
    state.recentCue = { type, frame: state.elapsed, ...payload };
    world.emit(NextLedgeGrappleCue, state.recentCue);
  }
  function release(world, state) {
    const p = state.player;
    p.vx = p.aVel * state.ropeLength * Math.cos(p.angle);
    p.vy = p.aVel * state.ropeLength * Math.sin(p.angle);
    state.mode = "falling";
    state.status = "Falling. Aim and fire the grapple.";
    emitCue(world, state, "release");
  }
  function launch(world, state) {
    if (state.stamina <= 4) {
      state.status = "Too exhausted to fire the grapple.";
      return;
    }
    const p = state.player;
    const aim = normalizeAim(state.aim.x, state.aim.y);
    const speed = Number(cfg.launchSpeed ?? 560);
    state.probe = { visible: true, x: p.x + aim.x * 8, y: p.y + aim.y * 8, vx: aim.x * speed, vy: aim.y * speed + speed * 0.42, age: 0 };
    state.lastLedgeId = state.currentLedgeId;
    state.mode = "launched";
    state.stamina = clamp(state.stamina - 4, 0, state.staminaMax);
    state.stats.launches += 1;
    state.status = "Grapple fired. It can catch anchors by tip or cable sweep.";
    emitCue(world, state, "shot");
  }
  function startReel(world, state, ledge) {
    state.mode = "reeling";
    state.probe.visible = false;
    state.anchor = { x: ledge.x, y: ledge.y, id: ledge.id, type: ledge.type };
    const d = hypot(ledge.x - state.player.x, ledge.y - state.player.y);
    state.reelLength = d + 24;
    state.status = `Latched ${ledge.label}. Reeling in.`;
    state.stats.catches += 1;
    emitCue(world, state, "latch", { ledgeId: ledge.id, ledgeType: ledge.type });
  }
  function updateSwing(world, state, dt) {
    const p = state.player;
    const gravity = state.gravity / 1000;
    const acc = -(gravity / state.ropeLength) * Math.sin(p.angle) + clamp(state.axis, -1, 1) * 0.21;
    p.aVel = clamp((p.aVel + acc * dt * 60) * Math.pow(0.988, dt * 60), -2.8, 2.8);
    p.angle = clamp(p.angle + p.aVel * dt, -1.35, 1.35);
    p.x = state.anchor.x + Math.sin(p.angle) * state.ropeLength;
    p.y = state.anchor.y - Math.cos(p.angle) * state.ropeLength;
    p.vx = p.aVel * state.ropeLength * Math.cos(p.angle);
    p.vy = p.aVel * state.ropeLength * Math.sin(p.angle);
    state.stamina = clamp(state.stamina - dt * (Math.abs(state.axis) > 0 ? 6.2 : 1.8), 0, state.staminaMax);
    if (state.stamina <= 0) release(world, state);
  }
  function applyFlight(state, dt, drag = 0.984) {
    const wind = Math.sin(state.elapsed * 1.9) * state.wind;
    const p = state.player;
    p.vx = (p.vx + wind * dt) * Math.pow(drag, dt * 60);
    p.vy = (p.vy - state.gravity * dt) * Math.pow(drag, dt * 60);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  function updateLaunched(world, state, dt) {
    applyFlight(state, dt);
    const probe = state.probe;
    probe.age += dt;
    const wind = Math.sin(state.elapsed * 1.9) * state.wind;
    probe.vx += wind * dt * 1.1;
    probe.vy -= state.gravity * 1.75 * dt;
    probe.x += probe.vx * dt;
    probe.y += probe.vy * dt;
    const p = state.player;
    const d = hypot(probe.x - p.x, probe.y - p.y);
    if (d > state.maxCableLength) {
      const r = state.maxCableLength / d;
      probe.x = p.x + (probe.x - p.x) * r;
      probe.y = p.y + (probe.y - p.y) * r;
    }
    for (const ledge of state.ledges) {
      if (ledge.id === state.lastLedgeId && probe.age < 0.18) continue;
      const tip = hypot(ledge.x - probe.x, ledge.y - probe.y);
      const sweep = distanceToSegment(ledge.x, ledge.y, p.x, p.y, probe.x, probe.y);
      if (tip <= ledge.r + 9.5 || sweep <= ledge.r + 5) {
        startReel(world, state, ledge);
        return;
      }
    }
    if (probe.age > 1.22) {
      state.mode = "retracting";
      state.status = "Grapple missed. Retracting.";
      emitCue(world, state, "miss");
    }
  }
  function updateRetracting(state, dt) {
    applyFlight(state, dt);
    const p = state.player;
    const probe = state.probe;
    const dx = p.x - probe.x;
    const dy = p.y - probe.y;
    const d = hypot(dx, dy);
    if (d < 9) {
      probe.visible = false;
      state.mode = "falling";
      state.status = "Grapple ready.";
      return;
    }
    probe.x += (dx / d) * 820 * dt;
    probe.y += (dy / d) * 820 * dt;
  }
  function updateReeling(world, state, dt) {
    const p = state.player;
    const a = state.anchor;
    const dx = a.x - p.x;
    const dy = a.y - p.y;
    const d = hypot(dx, dy) || 1;
    state.reelLength = Math.max(state.ropeLength, state.reelLength - 118 * dt);
    if (d > state.reelLength) {
      p.vx += (dx / d) * 35 * dt;
      p.vy += (dy / d) * 35 * dt;
    }
    p.vy -= state.gravity * dt * 0.42;
    p.vx *= Math.pow(0.942, dt * 60);
    p.vy *= Math.pow(0.942, dt * 60);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    state.stamina = clamp(state.stamina - dt * 8.2, 0, state.staminaMax);
    if (state.stamina <= 0) {
      release(world, state);
      return;
    }
    if (d <= state.ropeLength + 2 && state.reelLength <= state.ropeLength + 1) {
      state.mode = "swinging";
      state.currentLedgeId = a.id;
      p.angle = Math.atan2(p.x - a.x, a.y - p.y);
      const speed = hypot(p.vx, p.vy);
      p.aVel = clamp((p.vx >= 0 ? 1 : -1) * speed / state.ropeLength * 0.72, -2.4, 2.4);
      p.vx = 0;
      p.vy = 0;
      const ledge = state.ledges.find((item) => item.id === a.id);
      if (ledge?.type === "rest") {
        state.stamina = clamp(state.stamina + 45, 0, state.staminaMax);
        state.stats.rests += 1;
        state.status = "Rest relay restored stamina.";
        emitCue(world, state, "rest", { ledgeId: ledge.id });
      } else if (ledge?.type === "summit") {
        state.mode = "won";
        state.completed = true;
        state.status = "Summit reclaimed. Press N for the next sector.";
        emitCue(world, state, "win");
      } else {
        state.status = "Anchor caught. Build momentum for the next throw.";
      }
    }
  }
  function checkBounds(world, state) {
    const p = state.player;
    if (p.x < -state.boundary || p.x > state.boundary) {
      p.x = clamp(p.x, -state.boundary, state.boundary);
      p.vx *= -0.72;
      p.squash = 1.8;
      if (state.mode === "swinging" || state.mode === "reeling") release(world, state);
      emitCue(world, state, "bounce");
    }
    state.maxHeight = Math.max(state.maxHeight, p.y);
    if ((state.mode === "falling" || state.mode === "launched" || state.mode === "retracting") && p.y < state.maxHeight - 260) {
      state.mode = "dead";
      state.alive = false;
      state.probe.visible = false;
      state.stats.falls += 1;
      state.status = "Host aborted. Press R or Space to resync.";
      emitCue(world, state, "defeat");
    }
  }
  function makeSnapshot(state) {
    const p = state.player;
    const ropeVisible = state.mode === "swinging" || state.mode === "reeling" || state.mode === "launched" || state.mode === "retracting";
    const ropeStart = state.mode === "swinging" || state.mode === "reeling" ? state.anchor : p;
    const ropeEnd = state.mode === "launched" || state.mode === "retracting" ? state.probe : p;
    return {
      version: state.version,
      mode: state.mode,
      status: state.status,
      sector: state.sector,
      stamina: state.stamina,
      staminaMax: state.staminaMax,
      height: Math.max(0, Math.round(p.y / 10)),
      maxHeight: Math.max(0, Math.round(state.maxHeight / 10)),
      completed: state.completed,
      alive: state.alive,
      ledges: state.ledges,
      player: { x: p.x, y: p.y, z: 2, vx: p.vx, vy: p.vy, squash: p.squash ?? 1 },
      probe: { ...state.probe, z: 2 },
      aim: state.aim,
      reachRadius: state.maxCableLength,
      rope: { visible: ropeVisible, points: ropeVisible ? ropePoints(ropeStart, ropeEnd, state.mode === "launched" ? 10 : 4) : [] },
      camera: { x: 0, y: p.y + 55, z: 210 },
      recentCue: state.recentCue,
      stats: state.stats
    };
  }
  function system(world) {
    let state = copy(world.getResource(NextLedgeGrappleState) ?? createState(cfg, level));
    const dt = clamp(Number(world.__nexusClock?.delta ?? 1 / 60), 0, 1 / 30);
    state.elapsed += dt;
    state.recentCue = null;
    for (const event of world.readEvents(NextLedgeGrappleAdvanceSector)) state = restart(Number(event?.sector ?? state.sector + 1));
    for (const event of world.readEvents(NextLedgeGrappleRestart)) state = restart(Number(event?.sector ?? state.sector));
    for (const event of world.readEvents(NextLedgeGrappleAxis)) state.axis = clamp(Number(event?.axis ?? 0), -1, 1);
    for (const event of world.readEvents(NextLedgeGrappleAim)) state.aim = normalizeAim(Number(event?.x ?? state.aim.x), Number(event?.y ?? state.aim.y));
    for (const _event of world.readEvents(NextLedgeGrappleAction)) {
      if (state.mode === "dead" || state.mode === "won") state = restart(state.sector);
      else if (state.mode === "swinging" || state.mode === "reeling") release(world, state);
      else if (state.mode === "falling") launch(world, state);
      else if (state.mode === "launched") state.mode = "retracting";
    }
    if (state.mode === "swinging") updateSwing(world, state, dt);
    else if (state.mode === "falling") applyFlight(state, dt);
    else if (state.mode === "launched") updateLaunched(world, state, dt);
    else if (state.mode === "retracting") updateRetracting(state, dt);
    else if (state.mode === "reeling") updateReeling(world, state, dt);
    state.player.squash = 1 + (Number(state.player.squash ?? 1) - 1) * Math.pow(0.86, dt * 60);
    if (state.mode !== "won" && state.mode !== "dead") checkBounds(world, state);
    state.snapshot = makeSnapshot(state);
    world.setResource(NextLedgeGrappleState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "next-ledge-grapple-kit",
    provides: ["next-ledge:grapple"],
    resources: { NextLedgeGrappleState },
    events: { NextLedgeGrappleAction, NextLedgeGrappleAim, NextLedgeGrappleAxis, NextLedgeGrappleRestart, NextLedgeGrappleAdvanceSector, NextLedgeGrappleCue },
    systems: [{ phase: "simulate", system, name: "nextLedgeGrappleSystem" }],
    initWorld({ world }) { world.setResource(NextLedgeGrappleState, createState(cfg, level)); },
    install({ engine, world }) {
      engine.nextLedgeGrapple = {
        resources: { NextLedgeGrappleState },
        events: { NextLedgeGrappleAction, NextLedgeGrappleCue },
        action() { world.emit(NextLedgeGrappleAction, {}); return world.getResource(NextLedgeGrappleState); },
        setAimVector(x, y) { world.emit(NextLedgeGrappleAim, { x, y }); },
        setAimPoint(x, y) {
          const s = world.getResource(NextLedgeGrappleState);
          if (s?.player) world.emit(NextLedgeGrappleAim, { x: Number(x) - s.player.x, y: Number(y) - s.player.y });
        },
        swingAxis(axis) { world.emit(NextLedgeGrappleAxis, { axis }); },
        restart(sector) { world.emit(NextLedgeGrappleRestart, { sector }); return world.getResource(NextLedgeGrappleState); },
        advanceSector() { world.emit(NextLedgeGrappleAdvanceSector, {}); return world.getResource(NextLedgeGrappleState); },
        getState() { return world.getResource(NextLedgeGrappleState); },
        getSnapshot() { return world.getResource(NextLedgeGrappleState)?.snapshot ?? makeSnapshot(world.getResource(NextLedgeGrappleState) ?? createState(cfg, level)); }
      };
    },
    bindings: { nextLedgeGrappleLevel: level },
    metadata: { purpose: "Deterministic grapple, swing, reel, stamina, and vertical sector progression for Next Ledge." }
  });
}

export default createNextLedgeGrappleKit;
