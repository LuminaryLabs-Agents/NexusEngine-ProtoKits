export const NEXT_LEDGE_KIT_VERSION = "0.1.0";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

function clone(value) {
  return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
}

function requireNexus(NexusRealtime) {
  const required = ["defineResource", "defineEvent", "defineRuntimeKit"];
  for (const key of required) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createNextLedgeKit requires NexusRealtime.${key}.`);
    }
  }
}

function normalizeLevel(level = {}) {
  const objects = level.sceneRecipe?.objects ?? [];
  const ledges = objects
    .filter((object) => object.kit === "interaction-target" || object.archetype === "ledge" || object.archetype === "rope")
    .map((object, index) => ({
      id: object.id ?? `ledge-${index + 1}`,
      index,
      x: Number(object.transform?.x ?? 0),
      y: Number(object.transform?.y ?? 0),
      z: Number(object.transform?.z ?? 0),
      w: Number(object.transform?.w ?? 1),
      type: object.metadata?.type ?? object.archetype ?? "ledge",
      label: object.metadata?.label ?? object.id ?? `Ledge ${index + 1}`,
      cost: Number(object.metadata?.cost ?? 14),
      staminaRestore: Number(object.metadata?.staminaRestore ?? 0),
      anchor: object.metadata?.anchor ?? null,
      ropeLength: Number(object.metadata?.ropeLength ?? 3.5),
      risk: Number(object.metadata?.risk ?? 0),
      crumbleSeconds: Number(object.metadata?.crumbleSeconds ?? 0)
    }));

  if (ledges.length === 0) {
    throw new TypeError("createNextLedgeKit requires at least one interaction ledge or rope in level.sceneRecipe.objects.");
  }

  return {
    id: level.id ?? level.sceneRecipe?.id ?? "next-ledge-level",
    objects,
    ledges,
    route: level.route ?? ledges.map((ledge) => ledge.id),
    steps: level.steps ?? []
  };
}

export function createDefaultNextLedgeLevel() {
  return {
    id: "next-ledge-default-route",
    sceneRecipe: {
      id: "next-ledge-default-route",
      objects: [
        { id: "back-rock-face", archetype: "rock-layer", layer: "back", transform: { x: 0, y: 0, z: -5, w: 17, h: 10, d: 0.8 }, visual: { material: "rock-dark" } },
        { id: "mid-ledge-layer", archetype: "rock-layer", layer: "mid", transform: { x: 2.7, y: 0.4, z: -1.4, w: 9, h: 8, d: 1.2 }, visual: { material: "rock-mid" } },
        { id: "front-outcrops", archetype: "rock-layer", layer: "front", transform: { x: 6.5, y: -0.2, z: 1.8, w: 3.4, h: 7.6, d: 1.4 }, visual: { material: "rock-light" } },
        { id: "start", kit: "interaction-target", archetype: "ledge", action: "jump", transform: { x: -5.0, y: -2.85, z: 0, w: 1.25 }, metadata: { type: "start", cost: 0, label: "Start ledge" } },
        { id: "rope-gap", kit: "interaction-target", archetype: "rope", action: "jump", transform: { x: -2.65, y: -1.55, z: 0, w: 0.9 }, metadata: { type: "rope", cost: 12, label: "Rope swing", anchor: { x: -2.1, y: 2.25 }, ropeLength: 3.55 } },
        { id: "small-hold", kit: "interaction-target", archetype: "ledge", action: "jump", transform: { x: 0.15, y: -0.1, z: 0, w: 0.85 }, metadata: { type: "hold", cost: 16, label: "Small hold" } },
        { id: "ruin-rest", kit: "interaction-target", archetype: "ledge", action: "jump", transform: { x: 1.2, y: 1.28, z: 0, w: 1.35 }, metadata: { type: "rest", cost: 18, label: "Ruined rest platform", staminaRestore: 34 } },
        { id: "risk-chip", kit: "interaction-target", archetype: "ledge", action: "jump", transform: { x: 3.35, y: 2.55, z: 0, w: 0.95 }, metadata: { type: "risky", cost: 24, label: "Crumbling chip", risk: 0.15 } },
        { id: "right-ledge", kit: "interaction-target", archetype: "ledge", action: "jump", transform: { x: 5.35, y: 0.8, z: 0, w: 1.35 }, metadata: { type: "ledge", cost: 22, label: "Right ledge" } },
        { id: "summit", kit: "interaction-target", archetype: "ledge", action: "jump", transform: { x: 5.45, y: 2.72, z: 0, w: 1.25 }, metadata: { type: "finish", cost: 18, label: "Summit ledge" } }
      ]
    },
    visualDataset: {
      palette: { gold: "#ffd65a", danger: "#ff8f5a", rest: "#7af7c9" },
      materials: [
        { id: "rock-dark", color: "#4f5660", roughness: 0.92 },
        { id: "rock-mid", color: "#68635a", roughness: 0.88 },
        { id: "rock-light", color: "#8b806f", roughness: 0.84 },
        { id: "ledge-glow", color: "#ffd65a", emissive: true }
      ]
    },
    route: ["start", "rope-gap", "small-hold", "ruin-rest", "risk-chip", "right-ledge", "summit"],
    steps: [
      { id: "catch-rope", label: "Catch the rope", requiredAction: "jump", target: 1 },
      { id: "cross-wall", label: "Cross the wall", requiredAction: "jump", target: 4 },
      { id: "reach-summit", label: "Reach the summit", requiredAction: "jump", target: 1 }
    ]
  };
}

export function createNextLedgeKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineResource, defineEvent, defineRuntimeKit } = NexusRealtime;

  const normalized = normalizeLevel(config.level ?? createDefaultNextLedgeLevel());
  const ledges = normalized.ledges;
  const byId = Object.fromEntries(ledges.map((ledge) => [ledge.id, ledge]));

  const NextLedgeState = defineResource(config.resourceName ?? "nextLedge.state");
  const NextLedgeChoose = defineEvent("nextLedge.choose");
  const NextLedgeSwingAxis = defineEvent("nextLedge.swingAxis");
  const NextLedgeHover = defineEvent("nextLedge.hover");
  const NextLedgeRestart = defineEvent("nextLedge.restart");

  function distance(a, b) {
    return Math.hypot(Number(a.x ?? 0) - Number(b.x ?? 0), Number(a.y ?? 0) - Number(b.y ?? 0));
  }

  function createState(message = "Click the glowing rope. Swing only works while hanging.") {
    const start = byId[normalized.route?.[0]] ?? ledges[0];
    return {
      version: NEXT_LEDGE_KIT_VERSION,
      levelId: normalized.id,
      mode: "ready",
      alive: true,
      completed: false,
      status: message,
      currentId: start.id,
      currentIndex: start.index,
      hoverId: null,
      stamina: Number(config.staminaMax ?? 100),
      staminaMax: Number(config.staminaMax ?? 100),
      ledges,
      enabledTargetIds: [],
      player: { x: start.x, y: start.y + 0.55, z: 0.72, rotation: 0 },
      move: null,
      swing: { active: false, axis: 0, anchor: null, ropeLength: 3.5, angle: 0, angularVelocity: 0, momentum: 0 },
      lastChoice: null,
      lastReject: null,
      stats: { jumps: 0, falls: 0, restStops: 0, rejected: 0 }
    };
  }

  function enabledTargets(state) {
    if (!state.alive || state.mode === "falling" || state.completed || state.mode === "moving") return [];
    const maxStep = state.mode === "swinging" ? Number(config.swingTargetWindow ?? 4) : Number(config.targetWindow ?? 3);
    return ledges
      .filter((ledge) => ledge.index > state.currentIndex && ledge.index <= state.currentIndex + maxStep)
      .map((ledge) => ledge.id);
  }

  function reject(state, reason) {
    state.lastReject = reason;
    state.status = reason;
    state.stats.rejected += 1;
    return state;
  }

  function startMove(state, target) {
    const from = { ...state.player };
    const to = { x: target.x, y: target.y + 0.56, z: 0.72, rotation: 0 };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const arc = clamp(Math.abs(dx) * 0.24 + Math.max(0, dy) * 0.36 + Math.abs(state.swing.momentum) * 0.16, 0.45, 1.65);
    state.mode = "moving";
    state.move = {
      from,
      to,
      targetId: target.id,
      targetType: target.type,
      targetIndex: target.index,
      elapsed: 0,
      duration: clamp(0.42 + distance(from, to) * 0.09, 0.52, 1.08),
      arc,
      releasedFromSwing: state.swing.active
    };
    state.swing = { ...state.swing, active: false, axis: 0, momentum: state.swing.angularVelocity };
    state.lastChoice = target.id;
    state.lastReject = null;
    state.stats.jumps += 1;
    state.status = target.type === "rope" ? "Jumping for the rope…" : `Jumping to ${target.label}…`;
    return state;
  }

  function chooseTarget(state, targetId) {
    if (!state.alive || state.mode === "falling") return reject(state, "You are falling. Press R or Restart.");
    if (state.completed) return reject(state, "Summit reached. Press R to run the route again.");
    if (state.mode === "moving") return reject(state, "Already committed to a jump.");
    const target = byId[targetId];
    if (!target) return reject(state, "No ledge selected.");
    if (target.index <= state.currentIndex) return reject(state, "That ledge is behind you. Choose upward.");

    const d = distance(state.player, target);
    const swingBonus = state.mode === "swinging"
      ? clamp(Math.abs(state.swing.angularVelocity) * 1.35 + Math.abs(state.swing.angle) * 0.75, 0, 2.25)
      : 0;
    const reach = (state.mode === "swinging" ? Number(config.swingReach ?? 4.2) : Number(config.standingReach ?? 3.7)) + swingBonus;
    const sequenceBonus = target.index <= state.currentIndex + 2 ? 0.85 : 0;
    if (d > reach + sequenceBonus) {
      return reject(state, state.mode === "swinging"
        ? "Too far. Hold A or D longer to build horizontal momentum."
        : "Too far from here. Pick a closer glowing ledge.");
    }

    const staminaCost = clamp(target.cost + d * 1.9 - swingBonus * 3.0, 8, 36);
    if (state.stamina < staminaCost) return reject(state, "Not enough stamina. Find a rest ledge.");
    state.stamina = clamp(state.stamina - staminaCost, 0, state.staminaMax);
    return startMove(state, target);
  }

  function arrive(state, target) {
    state.currentId = target.id;
    state.currentIndex = target.index;
    state.player.x = target.x;
    state.player.y = target.y + 0.56;
    state.player.rotation = 0;
    state.move = null;

    if (target.type === "rope") {
      const anchor = target.anchor ?? { x: target.x, y: target.y + target.ropeLength };
      state.mode = "swinging";
      state.swing = { active: true, axis: 0, anchor, ropeLength: target.ropeLength, angle: -0.34, angularVelocity: 0.72, momentum: 0.72 };
      state.status = "On rope: hold A/D to build sideways momentum, then click a reachable ledge.";
      return state;
    }

    if (target.staminaRestore > 0) {
      state.stamina = clamp(state.stamina + target.staminaRestore, 0, state.staminaMax);
      state.stats.restStops += 1;
      state.status = `Rested on ${target.label}. Stamina restored.`;
    } else if (target.type === "risky") {
      state.status = "Crumbling ledge caught. Choose fast.";
    } else if (target.type === "finish") {
      state.mode = "complete";
      state.completed = true;
      state.status = "Summit reached. The route is complete.";
      return state;
    } else {
      state.status = `Caught ${target.label}. Pick the next ledge.`;
    }
    state.mode = "ready";
    return state;
  }

  function updateMoving(state, dt) {
    const move = state.move;
    if (!move) return state;
    move.elapsed += dt;
    const t = clamp(move.elapsed / move.duration, 0, 1);
    const e = easeOutCubic(t);
    state.player.x = lerp(move.from.x, move.to.x, e);
    state.player.y = lerp(move.from.y, move.to.y, e) + Math.sin(Math.PI * e) * move.arc;
    state.player.rotation = clamp((move.to.x - move.from.x) * -0.075, -0.45, 0.45) * Math.sin(Math.PI * e);
    if (t >= 1) arrive(state, byId[move.targetId]);
    return state;
  }

  function updateSwinging(state, dt) {
    const swing = state.swing;
    if (!swing.active || !swing.anchor) return state;
    const axis = clamp(Number(swing.axis ?? 0), -1, 1);
    swing.angularVelocity += (-Math.sin(swing.angle) * Number(config.gravity ?? 5.6) + axis * Number(config.swingDrive ?? 4.1)) * dt;
    swing.angularVelocity *= Math.pow(Number(config.swingDamping ?? 0.988), dt * 60);
    swing.angularVelocity = clamp(swing.angularVelocity, -2.65, 2.65);
    swing.angle = clamp(swing.angle + swing.angularVelocity * dt, -1.25, 1.25);
    swing.momentum = swing.angularVelocity;
    state.player.x = swing.anchor.x + Math.sin(swing.angle) * swing.ropeLength;
    state.player.y = swing.anchor.y - Math.cos(swing.angle) * swing.ropeLength;
    state.player.rotation = -swing.angle * 0.55;
    state.stamina = clamp(state.stamina - dt * (2.1 + Math.abs(axis) * 1.5), 0, state.staminaMax);
    if (state.stamina <= 0) {
      state.mode = "falling";
      state.alive = false;
      state.stats.falls += 1;
      state.status = "Grip lost. Press R or Restart.";
      swing.active = false;
    }
    return state;
  }

  function updateFalling(state, dt) {
    state.player.y -= dt * 5.5;
    state.player.rotation += dt * 3.0;
    return state;
  }

  function nextLedgeSystem(world) {
    let state = clone(world.getResource(NextLedgeState) ?? createState());
    const dt = clamp(Number(world.__nexusClock?.delta ?? 1 / 60), 0, 1 / 30);

    for (const _event of world.readEvents(NextLedgeRestart)) state = createState("Restarted. Click the glowing rope.");
    for (const event of world.readEvents(NextLedgeHover)) state.hoverId = event?.targetId ?? null;
    for (const event of world.readEvents(NextLedgeSwingAxis)) state.swing.axis = state.mode === "swinging" ? clamp(Number(event?.axis ?? 0), -1, 1) : 0;
    for (const event of world.readEvents(NextLedgeChoose)) state = chooseTarget(state, event?.targetId);

    if (state.mode !== "swinging") state.swing.axis = 0;
    if (state.mode === "moving") updateMoving(state, dt);
    if (state.mode === "swinging") updateSwinging(state, dt);
    if (state.mode === "falling") updateFalling(state, dt);

    state.enabledTargetIds = enabledTargets(state);
    world.setResource(NextLedgeState, state);
  }

  return defineRuntimeKit({
    id: config.id ?? "next-ledge-kit",
    resources: { NextLedgeState },
    events: { NextLedgeChoose, NextLedgeSwingAxis, NextLedgeHover, NextLedgeRestart },
    systems: [{ phase: "simulate", system: nextLedgeSystem, name: "nextLedgeSystem" }],
    initWorld({ world }) {
      world.setResource(NextLedgeState, createState());
    },
    install({ engine, world }) {
      engine.nextLedge = {
        resources: { NextLedgeState },
        choose(targetId) {
          world.emit(NextLedgeChoose, { targetId });
          engine.interactionTargets?.input?.("jump", { targetId });
          engine.objectiveFlow?.action?.("jump", { targetId });
          engine.tick(0);
          return world.getResource(NextLedgeState);
        },
        swingAxis(axis) {
          world.emit(NextLedgeSwingAxis, { axis });
        },
        hover(targetId) {
          world.emit(NextLedgeHover, { targetId });
        },
        restart() {
          world.emit(NextLedgeRestart, {});
          engine.objectiveFlow?.reset?.();
          engine.tick(0);
          return world.getResource(NextLedgeState);
        },
        getState() {
          return world.getResource(NextLedgeState);
        },
        getEnabledTargets() {
          return world.getResource(NextLedgeState)?.enabledTargetIds ?? [];
        }
      };
    },
    bindings: { nextLedgeLevel: normalized },
    metadata: { purpose: "Click-to-climb and rope-swing route rules for Next Ledge." }
  });
}
