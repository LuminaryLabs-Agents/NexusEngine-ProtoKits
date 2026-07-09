export const NEXT_LEDGE_CINEMATIC_ASCENT_VERSION = "0.2.0";
export const NEXT_LEDGE_KIT_VERSION = NEXT_LEDGE_CINEMATIC_ASCENT_VERSION;

const DEFAULT_SEED = "next-ledge-cinematic-ascent";
const clamp = (v, a, b) => Math.max(a, Math.min(b, Number.isFinite(Number(v)) ? Number(v) : a));
const n = (v, f = 0) => Number.isFinite(Number(v)) ? Number(v) : f;
const d2 = (a, b) => Math.hypot(n(a.x) - n(b.x), n(a.y) - n(b.y));
const copy = (v) => typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));

function hash(value = "") {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function requireNexus(NexusEngine) {
  for (const key of ["defineResource", "defineEvent", "defineRuntimeKit"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`createNextLedgeKit requires NexusEngine.${key}.`);
  }
}

function chunksFor(summitY, h = 600) {
  const total = Math.ceil((summitY + 500) / h) + 1;
  return Array.from({ length: total }, (_, i) => {
    const y = i * h - 300;
    return {
      id: `chunk-${i}`,
      y,
      h,
      scaffold: {
        leftX: -170,
        rightX: 170,
        braces: [{ x: 0, y: y + h * 0.22, rotation: 0.25 }, { x: 0, y: y + h * 0.75, rotation: -0.25 }],
        cables: [-110, 0, 110].map((x, cableIndex) => ({ id: `cable-${i}-${cableIndex}`, x, phase: i * 0.37 + cableIndex }))
      }
    };
  });
}

function proceduralRoute({ seed = DEFAULT_SEED, sector = 1, summitBase = 2200, summitStep = 800 } = {}) {
  const random = rng(hash(`${seed}:${sector}`));
  const summitY = summitBase + sector * summitStep;
  const ledges = [{ id: "anchor-0", index: 0, x: 0, y: 0, z: 0, r: 9, type: "normal", label: "Base anchor", staminaRestore: 0 }];
  let y = 70;
  let id = 1;
  while (y < summitY - 130) {
    const count = 2 + Math.floor(random() * 2);
    const spacing = 220 / count;
    for (let i = 0; i < count; i++) {
      const rest = random() < 0.22;
      ledges.push({
        id: `${rest ? "rest" : "ledge"}-${id}`,
        index: id,
        x: clamp(-95 + i * spacing + (random() - 0.5) * 16, -145, 145),
        y: y + (random() - 0.5) * 14,
        z: 0,
        r: rest ? 6.5 : 4,
        type: rest ? "rest" : "normal",
        label: rest ? `Restore node ${id}` : `Anchor node ${id}`,
        staminaRestore: rest ? 45 : 0
      });
      id += 1;
    }
    y += 95 + random() * 32;
  }
  ledges.push({ id: "summit", index: id, x: 0, y: summitY, z: 0, r: 14, type: "summit", label: "Summit anchor", staminaRestore: 0 });
  return { id: `next-ledge-sector-${sector}`, seed, sector, summitY, ledges, chunks: chunksFor(summitY), route: ledges.map((l) => l.id) };
}

export function createProceduralNextLedgeLevel(options = {}) {
  return {
    id: options.id ?? "next-ledge-cinematic-ascent",
    procedural: true,
    seed: options.seed ?? DEFAULT_SEED,
    summitBase: n(options.summitBase, 2200),
    summitStep: n(options.summitStep, 800),
    steps: [{ id: "restore-stamina", label: "Find restore units", requiredAction: "rest", target: 1 }, { id: "reach-summit", label: "Reach the summit", requiredAction: "summit", target: 1 }]
  };
}

export function createDefaultNextLedgeLevel() {
  return createProceduralNextLedgeLevel();
}

function segmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  if (!len) return Math.hypot(px - ax, py - ay);
  const t = clamp(((px - ax) * dx + (py - ay) * dy) / len, 0, 1);
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}

function ropeNodes(start, end, count, wind = 0, slack = 0) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / Math.max(1, count - 1);
    const sag = Math.sin(Math.PI * t) * slack;
    const sway = Math.sin(t * Math.PI * 2) * wind * Math.sin(Math.PI * t);
    return { x: start.x + (end.x - start.x) * t + sway, y: start.y + (end.y - start.y) * t - sag, z: 1 };
  });
}

function event(state, type, payload = {}) {
  state.recentEvents.push({ type, at: state.frame, ...payload });
  if (state.recentEvents.length > 16) state.recentEvents.shift();
}

function aimFrom(state, payload = {}) {
  if (Number.isFinite(Number(payload.x)) || Number.isFinite(Number(payload.y))) {
    const dx = n(payload.x, state.player.x) - state.player.x;
    const dy = n(payload.y, state.player.y + 1) - state.player.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len, worldX: n(payload.x), worldY: n(payload.y) };
  }
  const dx = n(payload.dx, state.aim.x);
  const dy = n(payload.dy, state.aim.y);
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len, worldX: state.player.x + dx * 150, worldY: state.player.y + dy * 150 };
}

export function createNextLedgeKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineResource, defineEvent, defineRuntimeKit } = NexusEngine;
  const State = defineResource(config.resourceName ?? "nextLedge.state");
  const Action = defineEvent("nextLedge.action");
  const Choose = defineEvent("nextLedge.choose");
  const Aim = defineEvent("nextLedge.aim");
  const SwingAxis = defineEvent("nextLedge.swingAxis");
  const Hover = defineEvent("nextLedge.hover");
  const Restart = defineEvent("nextLedge.restart");
  const AdvanceSector = defineEvent("nextLedge.advanceSector");
  const Pause = defineEvent("nextLedge.pause");
  const GrappleFired = defineEvent("nextLedge.grappleFired");
  const GrappleLatched = defineEvent("nextLedge.grappleLatched");
  const Restored = defineEvent("nextLedge.restored");
  const Failed = defineEvent("nextLedge.failed");
  const SummitReached = defineEvent("nextLedge.summitReached");
  const SectorAdvanced = defineEvent("nextLedge.sectorAdvanced");

  const level = config.level ?? createProceduralNextLedgeLevel(config);
  const maxStamina = n(config.staminaMax, 100);
  const ropeLength = n(config.ropeLength, 52);
  const maxCable = n(config.maxCableLength, 150);
  const nodeCount = Math.max(4, Math.floor(n(config.ropeNodeCount, 12)));

  function makeState(sector = n(config.sector, 1), status = "SYS_STATUS: ACTIVE") {
    const route = proceduralRoute({ seed: level.seed ?? DEFAULT_SEED, sector, summitBase: n(level.summitBase, 2200), summitStep: n(level.summitStep, 800) });
    const start = route.ledges[0];
    const player = { x: start.x, y: start.y - ropeLength, z: 1, vx: 0, vy: 0, angle: 0, aVel: 0, scaleX: 1, scaleY: 1, scaleZ: 1, rotationX: 0, rotationY: 0 };
    return {
      version: NEXT_LEDGE_CINEMATIC_ASCENT_VERSION,
      levelId: route.id,
      frame: 0,
      sector,
      mode: "swinging",
      alive: true,
      completed: false,
      paused: false,
      status,
      route,
      currentAnchorId: start.id,
      lastLedgeId: start.id,
      anchorLedge: start,
      constants: { gravity: n(config.gravityBase, 0.052) + sector * n(config.gravityPerSector, 0.003), ropeLength, maxCableLength: maxCable, maxStamina, scaffoldBoundary: n(config.scaffoldBoundary, 166) },
      stamina: maxStamina,
      maxHeight: 0,
      wind: { strength: (sector - 1) * n(config.windPerSector, 0.006), offset: 0 },
      aim: { x: 0, y: 1, worldX: 0, worldY: maxCable },
      input: { axis: 0 },
      player,
      probe: { x: player.x, y: player.y, z: 1, vx: 0, vy: 0, ticks: 0, visible: false },
      rope: { visible: true, start, end: player, nodes: ropeNodes(start, player, nodeCount, 0, 8), targetLength: ropeLength },
      reeling: { ropeLength, anchorId: null },
      camera: { x: 0, y: player.y + 40, z: 210, targetY: player.y + 95 },
      reach: { x: player.x, y: player.y, r: maxCable },
      trajectory: [],
      effects: { sparks: [], trail: [] },
      enabledTargetIds: [],
      hoveredId: null,
      stats: { launches: 0, latches: 0, releases: 0, wallBounces: 0, rests: 0, falls: 0, sectorsCleared: sector - 1, rejected: 0 },
      recentEvents: []
    };
  }

  const map = (state) => Object.fromEntries(state.route.ledges.map((l) => [l.id, l]));
  const enabled = (state) => state.alive && !state.completed ? state.route.ledges.filter((l) => l.id !== state.lastLedgeId && d2(l, state.player) <= maxCable + l.r).map((l) => l.id) : [];
  const setRope = (state, a, b, slack = 8) => { state.rope = { ...state.rope, start: { x: a.x, y: a.y, z: 1 }, end: { x: b.x, y: b.y, z: 1 }, nodes: ropeNodes(a, b, nodeCount, state.wind.strength * 18, slack), targetLength: d2(a, b) + slack }; };

  function release(state) {
    state.mode = "falling";
    state.rope.visible = false;
    state.probe.visible = false;
    state.stats.releases += 1;
    state.status = "Tether released. Aim and fire before falling out of frame.";
    event(state, "released", { x: state.player.x, y: state.player.y });
  }

  function launch(state) {
    if (state.stamina <= 0) return;
    const speed = n(config.throwSpeed, 9.5);
    state.mode = "launched";
    state.lastLedgeId = state.currentAnchorId;
    state.probe = { x: state.player.x + state.aim.x * 8, y: state.player.y + state.aim.y * 8, z: 1, vx: state.aim.x * speed, vy: state.aim.y * speed + speed * 0.42, ticks: 0, visible: true };
    state.rope.visible = true;
    state.stamina = clamp(state.stamina - 4, 0, maxStamina);
    state.stats.launches += 1;
    state.status = "Grapple fired. Cable sweep can latch nearby anchors.";
    event(state, "grapple-fired", { x: state.probe.x, y: state.probe.y });
  }

  function grab(state, ledge) {
    state.mode = "reeling";
    state.anchorLedge = ledge;
    state.reeling = { anchorId: ledge.id, ropeLength: d2(ledge, state.player) + 24 };
    state.probe.visible = false;
    state.rope.visible = true;
    state.stats.latches += 1;
    state.status = `Latched ${ledge.label}. Winch pulling to swing radius.`;
    event(state, "grapple-latched", { targetId: ledge.id, type: ledge.type });
  }

  function lock(state, ledge) {
    state.currentAnchorId = ledge.id;
    state.lastLedgeId = ledge.id;
    state.anchorLedge = ledge;
    state.player.angle = Math.atan2(state.player.x - ledge.x, ledge.y - state.player.y || 0.001);
    state.player.aVel = (state.player.vx >= 0 ? 1 : -1) * (Math.hypot(state.player.vx, state.player.vy) / ropeLength) * 0.72;
    state.player.vx = 0;
    state.player.vy = 0;
    if (ledge.type === "summit") {
      state.mode = "won";
      state.completed = true;
      state.status = "Summit reclaimed. Sector clearance criteria reached.";
      event(state, "summit-reached", { sector: state.sector });
    } else {
      state.mode = "swinging";
      if (ledge.type === "rest") {
        state.stamina = clamp(state.stamina + n(ledge.staminaRestore, 45), 0, maxStamina);
        state.stats.rests += 1;
        state.status = "Restore unit synchronized. Stamina replenished.";
        event(state, "restored", { targetId: ledge.id });
      } else state.status = `Swinging from ${ledge.label}. Release when your arc feels right.`;
    }
  }

  function fail(state, reason) {
    if (state.mode === "dead") return;
    state.mode = "dead";
    state.alive = false;
    state.rope.visible = false;
    state.probe.visible = false;
    state.stats.falls += 1;
    state.status = reason;
    event(state, "failed", { reason });
  }

  function command(state, action) {
    if (["dead", "won"].includes(state.mode)) return;
    if (state.mode === "swinging" || state.mode === "reeling") release(state);
    else if (state.mode === "falling") launch(state);
    else if (state.mode === "launched") { state.mode = "retracting"; state.status = "Grapple retracting."; }
  }

  function stepSwing(state, dt) {
    const ledge = map(state)[state.currentAnchorId] ?? state.route.ledges[0];
    const axis = clamp(state.input.axis, -1, 1);
    let acc = -(state.constants.gravity / ropeLength) * Math.sin(state.player.angle) + axis * 0.0035;
    acc += state.wind.strength * Math.sin(state.wind.offset) * Math.cos(state.player.angle) / ropeLength;
    state.player.aVel = (state.player.aVel + acc) * 0.988;
    state.player.angle += state.player.aVel;
    state.player.x = ledge.x + Math.sin(state.player.angle) * ropeLength;
    state.player.y = ledge.y - Math.cos(state.player.angle) * ropeLength;
    state.player.vx = state.player.aVel * ropeLength * Math.cos(state.player.angle);
    state.player.vy = state.player.aVel * ropeLength * Math.sin(state.player.angle);
    state.stamina = clamp(state.stamina - (Math.abs(axis) ? 0.062 : 0.018) * (1 + state.sector * 0.15) * dt * 60, 0, maxStamina);
    state.rope.visible = true;
    setRope(state, ledge, state.player, 8);
    if (state.stamina <= 0) release(state);
  }

  function fallPlayer(state, dt, drag = true) {
    const wind = state.wind.strength * Math.sin(state.wind.offset);
    state.player.vx += wind * 0.15 * dt * 60;
    state.player.vy -= state.constants.gravity * dt * 60;
    if (drag) { state.player.vx *= Math.pow(0.96, dt * 60); state.player.vy *= Math.pow(0.96, dt * 60); }
    state.player.x += state.player.vx * dt * 60;
    state.player.y += state.player.vy * dt * 60;
  }

  function stepLaunched(state, dt) {
    fallPlayer(state, dt, false);
    state.probe.ticks += 1;
    state.probe.vy -= state.constants.gravity * 1.75 * dt * 60;
    state.probe.x += state.probe.vx * dt * 60;
    state.probe.y += state.probe.vy * dt * 60;
    const gap = d2(state.player, state.probe);
    if (gap > maxCable) {
      const r = maxCable / gap;
      state.probe.x = state.player.x + (state.probe.x - state.player.x) * r;
      state.probe.y = state.player.y + (state.probe.y - state.player.y) * r;
    }
    setRope(state, state.player, state.probe, 14);
    for (const ledge of state.route.ledges) {
      if (ledge.id === state.lastLedgeId && state.probe.ticks < 10) continue;
      if (d2(ledge, state.probe) <= ledge.r + 9.5 || segmentDistance(ledge.x, ledge.y, state.player.x, state.player.y, state.probe.x, state.probe.y) <= ledge.r + 5) return grab(state, ledge);
    }
    if (state.probe.ticks > n(config.launchTicksMax, 70)) state.mode = "retracting";
  }

  function stepRetracting(state, dt) {
    fallPlayer(state, dt);
    const gap = d2(state.player, state.probe);
    if (gap < 10) { state.mode = "falling"; state.probe.visible = false; state.rope.visible = false; return; }
    const s = 15 * dt * 60;
    state.probe.x += (state.player.x - state.probe.x) / gap * s;
    state.probe.y += (state.player.y - state.probe.y) / gap * s;
    state.probe.visible = true;
    state.rope.visible = true;
    setRope(state, state.player, state.probe, 12);
  }

  function stepReeling(state, dt) {
    const anchor = state.anchorLedge ?? map(state)[state.reeling.anchorId];
    const gap = d2(anchor, state.player) || 0.001;
    state.reeling.ropeLength = Math.max(ropeLength, state.reeling.ropeLength - 1.85 * dt * 60);
    if (gap <= ropeLength && state.reeling.ropeLength <= ropeLength) return lock(state, anchor);
    if (gap > state.reeling.ropeLength) {
      state.player.vx += (anchor.x - state.player.x) / gap * 0.58 * dt * 60;
      state.player.vy += (anchor.y - state.player.y) / gap * 0.58 * dt * 60;
    }
    state.player.vy -= state.constants.gravity * 0.42 * dt * 60;
    state.player.vx *= Math.pow(0.942, dt * 60);
    state.player.vy *= Math.pow(0.942, dt * 60);
    state.player.x += state.player.vx * dt * 60;
    state.player.y += state.player.vy * dt * 60;
    setRope(state, anchor, state.player, Math.max(0, state.reeling.ropeLength - gap));
    state.stamina = clamp(state.stamina - 0.082 * dt * 60, 0, maxStamina);
    if (state.stamina <= 0) release(state);
  }

  function updateDerived(state) {
    state.player.scaleX = clamp(1 + Math.abs(state.player.vx) * 0.038, 0.35, 2);
    state.player.scaleY = clamp(1 + Math.abs(state.player.vy) * 0.038, 0.35, 2);
    state.player.rotationX += 0.035;
    state.player.rotationY += state.player.vx * 0.04;
    state.camera.targetY = state.player.y + 55;
    state.camera.y += (state.camera.targetY - state.camera.y) * (["falling", "retracting"].includes(state.mode) ? 0.075 : 0.038);
    state.reach = { x: state.player.x, y: state.player.y, r: maxCable };
    state.maxHeight = Math.max(state.maxHeight, Math.round(state.player.y / 10));
    state.enabledTargetIds = enabled(state);
    state.trajectory = ["falling", "retracting"].includes(state.mode) ? Array.from({ length: 38 }, (_, i) => {
      let x = state.player.x, y = state.player.y, vx = state.player.vx, vy = state.player.vy;
      for (let s = 0; s < i; s++) { vy -= state.constants.gravity; vx *= 0.96; vy *= 0.96; x += vx; y += vy; }
      return { x, y, z: 1 };
    }) : [];
  }

  function system(world) {
    const before = world.getResource(State);
    let state = copy(before ?? makeState());
    const dt = clamp(n(world.__nexusClock?.delta, 1 / 60), 0, 1 / 30);
    for (const e of world.readEvents(Restart)) state = makeState(state.sector, e?.message ?? "Host resynced. Sector restarted.");
    for (const e of world.readEvents(AdvanceSector)) { state = makeState(Math.max(1, Math.floor(n(e?.sector, state.sector + 1))), "Ascending next sector. New anchor field generated."); event(state, "sector-advanced", { sector: state.sector }); }
    for (const e of world.readEvents(Pause)) state.paused = e?.paused == null ? !state.paused : Boolean(e.paused);
    for (const e of world.readEvents(Aim)) state.aim = { ...state.aim, ...aimFrom(state, e) };
    for (const e of world.readEvents(Hover)) state.hoveredId = e?.targetId ?? null;
    for (const e of world.readEvents(SwingAxis)) state.input.axis = state.mode === "swinging" ? clamp(e?.axis ?? 0, -1, 1) : 0;
    for (const e of world.readEvents(Choose)) { const target = map(state)[e?.targetId]; if (target) state.aim = aimFrom(state, target); if (target && state.mode === "falling") launch(state); }
    for (const e of world.readEvents(Action)) command(state, e);
    if (!state.paused && !["dead", "won"].includes(state.mode)) {
      state.frame += 1;
      state.wind.offset += 0.045 * dt * 60;
      if (state.mode !== "swinging") state.input.axis = 0;
      if (state.mode === "swinging") stepSwing(state, dt);
      else if (state.mode === "falling") fallPlayer(state, dt);
      else if (state.mode === "launched") stepLaunched(state, dt);
      else if (state.mode === "retracting") stepRetracting(state, dt);
      else if (state.mode === "reeling") stepReeling(state, dt);
      if (state.player.x < -state.constants.scaffoldBoundary || state.player.x > state.constants.scaffoldBoundary) { state.player.x = clamp(state.player.x, -state.constants.scaffoldBoundary, state.constants.scaffoldBoundary); state.player.vx = -state.player.vx * 0.72; state.stats.wallBounces += 1; if (["swinging", "reeling"].includes(state.mode)) release(state); }
      if (["falling", "retracting"].includes(state.mode) && state.player.y < state.camera.y - n(config.fallDeathDistance, 420)) fail(state, "Host aborted. Anchor connection lost below sector floor.");
    }
    updateDerived(state);
    const seen = new Set((before?.recentEvents ?? []).map((e) => `${e.at}:${e.type}:${e.targetId ?? e.reason ?? ""}`));
    for (const e of state.recentEvents) {
      const key = `${e.at}:${e.type}:${e.targetId ?? e.reason ?? ""}`;
      if (seen.has(key)) continue;
      if (e.type === "grapple-fired") world.emit(GrappleFired, e);
      if (e.type === "grapple-latched") world.emit(GrappleLatched, e);
      if (e.type === "restored") world.emit(Restored, e);
      if (e.type === "failed") world.emit(Failed, e);
      if (e.type === "summit-reached") world.emit(SummitReached, e);
      if (e.type === "sector-advanced") world.emit(SectorAdvanced, e);
    }
    world.setResource(State, state);
  }

  return defineRuntimeKit({
    id: config.id ?? "next-ledge-cinematic-ascent-kit",
    provides: ["next-ledge:grapple-ascent", "climb:cinematic-grapple", "progression:vertical-sector"],
    resources: { State },
    events: { Action, Choose, Aim, SwingAxis, Hover, Restart, AdvanceSector, Pause, GrappleFired, GrappleLatched, Restored, Failed, SummitReached, SectorAdvanced },
    systems: [{ phase: "simulate", name: "nextLedgeCinematicAscentSystem", system }],
    initWorld({ world }) { world.setResource(State, makeState()); },
    install({ engine, world }) {
      const current = () => world.getResource(State);
      const now = () => { if (config.immediate !== false) engine.tick?.(0); return current(); };
      engine.nextLedge = {
        version: NEXT_LEDGE_CINEMATIC_ASCENT_VERSION,
        resources: { State },
        action(payload = {}) { world.emit(Action, payload); return now(); },
        choose(targetId) { world.emit(Choose, { targetId }); engine.interactionTargets?.input?.("jump", { targetId }); engine.objectiveFlow?.action?.("jump", { targetId }); return now(); },
        aim(payload = {}) { world.emit(Aim, payload); return current(); },
        setAimVector(dx = 0, dy = 1) { world.emit(Aim, { dx, dy }); return current(); },
        setAimWorld(x = 0, y = 1) { world.emit(Aim, { x, y }); return current(); },
        swingAxis(axis = 0) { world.emit(SwingAxis, { axis }); return current(); },
        hover(targetId = null) { world.emit(Hover, { targetId }); return current(); },
        restart(message) { world.emit(Restart, { message }); engine.objectiveFlow?.reset?.(); return now(); },
        advanceSector(sector) { world.emit(AdvanceSector, { sector }); return now(); },
        pause(paused) { world.emit(Pause, { paused }); return now(); },
        getState: current,
        getSnapshot: current,
        getEnabledTargets: () => current()?.enabledTargetIds ?? []
      };
    },
    bindings: { nextLedgeLevel: level },
    metadata: { purpose: "Renderer-independent cinematic grapple ascent ProtoKit extracted from the Next Ledge monolith.", version: NEXT_LEDGE_CINEMATIC_ASCENT_VERSION }
  });
}

export default createNextLedgeKit;
