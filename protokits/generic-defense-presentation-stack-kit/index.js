export const GENERIC_DEFENSE_PRESENTATION_STACK_VERSION = "0.1.0";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function n(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function dist(a, b) {
  return Math.hypot(n(a?.x) - n(b?.x), n(a?.y) - n(b?.y));
}

function sortedEntries(object = {}) {
  return Object.entries(object ?? {}).sort(([a], [b]) => a.localeCompare(b));
}

function getSnapshot(engine) {
  return engine?.n?.genericDefense?.sessionFacade?.getSnapshot?.() ?? engine?.genericDefense?.getSnapshot?.() ?? {};
}

function getSelected(snapshot) {
  const session = snapshot?.session ?? {};
  if (!session.selectedId) return null;
  if (session.selectedKind === "structure") return snapshot?.structures?.structures?.[session.selectedId] ?? null;
  if (session.selectedKind === "agent") return snapshot?.agents?.active?.[session.selectedId] ?? null;
  return { id: session.selectedId, kind: session.selectedKind };
}

function materialForRole(role, variant) {
  const tower = {
    low: "#1d3040",
    mid: variant?.color ?? "#8bd3ff",
    high: "#e8fbff",
    outline: "#09121a"
  };
  const enemy = {
    low: "#2a1118",
    mid: variant?.color ?? "#ff7f7a",
    high: "#ffd1c8",
    outline: "#18070b"
  };
  const terrain = { low: "#071017", mid: "#203442", high: "#527383", outline: "#05090d" };
  const boss = { low: "#2b160b", mid: variant?.color ?? "#ffe36d", high: "#fff1a8", outline: "#210c06" };
  const ui = { low: "#071017", mid: "#153141", high: "#8bd3ff", outline: "#ecfbff" };
  return { terrain, tower, enemy, boss, ui }[role] ?? tower;
}

function towerIdentityFor(blueprint = {}) {
  const identities = {
    bolt: ["needle-spire", "arc", "single-muzzle"],
    ember: ["cauldron", "flame", "lobbed-orb"],
    slow: ["crystal-pin", "snowflake", "cold-pulse"],
    prism: ["lance-obelisk", "prism", "beam-tip"],
    thumper: ["drum", "quake", "lobbed-shell"],
    volt: ["coil", "lightning", "rapid-spark"],
    umbra: ["thin-dagger", "eye", "shadow-needle"],
    bloom: ["flower-mortar", "petal", "burst-orb"],
    siphon: ["reed", "leaf", "green-pulse"],
    bastion: ["bell", "crest", "heavy-orb"],
    flare: ["flare-needle", "sun", "reveal-flash"],
    anchor: ["anchor-coil", "chain", "weighted-shot"]
  };
  const [silhouette, motif, emitter] = identities[blueprint.id] ?? ["neutral-tower", "dot", "muzzle"];
  return { towerId: blueprint.id, silhouette, motif, emitter, color: blueprint.color ?? "#8bd3ff", role: blueprint.role ?? "tower" };
}

function enemyBadges(enemy = {}) {
  const badges = [];
  if (enemy.boss) badges.push("boss-crown");
  if (enemy.shield) badges.push("shield-hex");
  if (enemy.stealth) badges.push("haze-eye");
  if (enemy.splitsInto) badges.push("split-fork");
  if (enemy.aura) badges.push(`${enemy.aura}-aura`);
  if (enemy.traversal === "flying") badges.push("wing");
  return badges;
}

function nearestSlot(snapshot, point, maxDistance = 54) {
  let best = null;
  let bestDistance = Infinity;
  for (const slot of Object.values(snapshot?.map?.slots ?? {})) {
    const d = dist(point, slot);
    if (d < bestDistance) {
      best = slot;
      bestDistance = d;
    }
  }
  return best && bestDistance <= maxDistance ? { slot: best, distance: bestDistance } : null;
}

function isSlotOccupied(snapshot, slotId) {
  return Object.values(snapshot?.structures?.structures ?? {}).some((structure) => structure.slotId === slotId);
}

function makeKit(NexusEngine, spec) {
  return NexusEngine.defineRuntimeKit({
    id: spec.id,
    requires: spec.requires ?? ["game:generic-defense"],
    provides: spec.provides ?? [],
    resources: spec.resources ?? {},
    events: spec.events ?? {},
    systems: spec.systems ?? [],
    install: spec.install,
    initWorld: spec.initWorld,
    metadata: {
      version: GENERIC_DEFENSE_PRESENTATION_STACK_VERSION,
      purpose: spec.purpose,
      presentationOnly: true
    }
  });
}

export function createGenericStylizedViewRigKit(NexusEngine, config = {}) {
  const state = {
    mode: "oblique-2.5d",
    pitch: n(config.pitch, 58),
    yaw: n(config.yaw, 45),
    zoom: n(config.zoom, 1),
    minZoom: n(config.minZoom, 0.82),
    maxZoom: n(config.maxZoom, 1.28),
    pan: { x: n(config.pan?.x), y: n(config.pan?.y) },
    screenSafeArea: config.screenSafeArea ?? { top: 56, right: 320, bottom: 150, left: 24 },
    yCompression: n(config.yCompression, 0.78),
    zLift: n(config.zLift, 0.72)
  };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-stylized-view-rig-kit",
    requires: [],
    provides: ["view:stylized-rig", "camera:2.5d", "camera:screen-to-world", "camera:world-to-screen"],
    purpose: "Owns a fixed 2.5D oblique viewing grammar and safe UI composition zones.",
    install({ engine }) {
      engine.stylizedView = {
        setZoom(value) { state.zoom = Math.max(state.minZoom, Math.min(state.maxZoom, n(value, state.zoom))); return state.zoom; },
        panBy(dx = 0, dy = 0) { state.pan = { x: state.pan.x + n(dx), y: state.pan.y + n(dy) }; return clone(state.pan); },
        focusWorldPoint(point = {}) { state.pan = { x: -n(point.x) * 0.02, y: -n(point.y) * 0.02 }; return clone(state.pan); },
        worldToScreen(point = {}) { return { x: n(point.x) * state.zoom + state.pan.x, y: n(point.y) * state.yCompression * state.zoom + state.pan.y - n(point.z) * state.zLift }; },
        screenToWorld(point = {}) { return { x: (n(point.x) - state.pan.x) / state.zoom, y: (n(point.y) - state.pan.y) / (state.yCompression * state.zoom) }; },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericCelMaterialKit(NexusEngine, config = {}) {
  const state = { shadowBands: 3, highlightBands: 2, rimStrength: 0.55, saturation: 1.08, palette: config.palette ?? {} };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-cel-material-kit",
    requires: [],
    provides: ["style:cel-materials", "render:material-descriptors"],
    purpose: "Defines cel-shaded material ramps for terrain, towers, enemies, bosses, UI, and placement ghosts.",
    install({ engine }) {
      engine.celMaterials = {
        getMaterial(role = "tower", variant = {}) { return { kind: "cel-material", role, ...materialForRole(role, variant), shadowBands: state.shadowBands, highlightBands: state.highlightBands, rimStrength: state.rimStrength }; },
        setPalette(palette = {}) { state.palette = { ...state.palette, ...palette }; return clone(state.palette); },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericInkOutlineKit(NexusEngine, config = {}) {
  const state = { hoverId: null, selectedId: null, defaultWidth: 2, selectedWidth: 4, hoverWidth: 3, bossWidth: 5, colors: { ally: "#101820", enemy: "#241018", selected: "#ffe36d", hover: "#8bd3ff", boss: "#ff7a5c", ...(config.colors ?? {}) } };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-ink-outline-kit",
    requires: [],
    provides: ["style:outline", "render:outline-descriptors"],
    purpose: "Creates strong inked silhouettes for allies, enemies, hover, selection, and bosses.",
    install({ engine }) {
      engine.inkOutline = {
        setHover(entityId) { state.hoverId = entityId ?? null; return state.hoverId; },
        setSelected(entityId) { state.selectedId = entityId ?? null; return state.selectedId; },
        getOutline(entity = {}) {
          const boss = entity.boss === true;
          const selected = entity.id && entity.id === state.selectedId;
          const hover = entity.id && entity.id === state.hoverId;
          const role = boss ? "boss" : selected ? "selected" : hover ? "hover" : entity.entityType === "enemy" ? "enemy" : "ally";
          return { kind: "outline", entityId: entity.id, width: boss ? state.bossWidth : selected ? state.selectedWidth : hover ? state.hoverWidth : state.defaultWidth, color: state.colors[role], priority: boss ? 4 : selected ? 3 : hover ? 2 : 1 };
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericStylizedLightingKit(NexusEngine, config = {}) {
  const state = {
    mood: config.mood ?? "dawn-bastion",
    keyLight: config.keyLight ?? { direction: { x: -0.4, y: -0.7, z: 0.6 }, color: "#ffe1a8", intensity: 1.2 },
    fillLight: config.fillLight ?? { color: "#7fb8ff", intensity: 0.32 },
    shadowTint: config.shadowTint ?? "#182433",
    ambientRamp: config.ambientRamp ?? ["#061018", "#132434", "#274557"]
  };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-stylized-lighting-kit",
    requires: [],
    provides: ["style:lighting", "render:lighting-descriptors"],
    purpose: "Defines stylized key/fill/ambient lighting descriptors for cel-shaded scenes.",
    install({ engine }) {
      engine.stylizedLighting = {
        setMood(moodId) { state.mood = moodId ?? state.mood; return state.mood; },
        getLightingDescriptor() { return { kind: "stylized-lighting", ...clone(state) }; },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericDefenseGroundReadabilityKit(NexusEngine, config = {}) {
  const state = { laneStyle: "painted-cel-ribbon", pathEdgeWidth: 6, buildZoneStyle: "soft-rings", blockedZoneStyle: "hatched-red", gridVisible: false, ...(config.state ?? {}) };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-defense-ground-readability-kit",
    provides: ["ground:readability", "render:ground-descriptors", "placement:affordance-descriptors"],
    purpose: "Emits authored-looking path, lane, build affordance, and blocked-zone descriptors.",
    install({ engine }) {
      engine.groundReadability = {
        getDescriptors() {
          const snapshot = getSnapshot(engine);
          const structures = snapshot?.structures?.structures ?? {};
          const occupied = new Set(Object.values(structures).map((structure) => structure.slotId));
          return [
            { kind: "ground-path", id: "main-path", points: clone(snapshot?.map?.path ?? []), width: 38, fill: "rgba(35,56,68,.88)", edge: "rgba(255,227,109,.30)", priority: 1 },
            ...Object.values(snapshot?.map?.slots ?? {}).map((slot) => ({ kind: "build-affordance", slotId: slot.id, x: slot.x, y: slot.y, radius: slot.radius ?? 26, status: occupied.has(slot.id) ? "occupied" : "free", hiddenUntilPlacement: true }))
          ];
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericPlacementProjectorKit(NexusEngine, config = {}) {
  const state = { active: false, blueprintId: null, worldPoint: null, valid: false, reason: null, collisionRadius: 24, rangePreview: 120, ghostOpacity: 0.72, slotId: null };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-placement-projector-kit",
    provides: ["placement:projector", "placement:ghost", "placement:validity-feedback"],
    purpose: "Supports free-placement-style ghosts and closest-valid-anchor confirmation while keeping simulation validation reusable.",
    install({ engine }) {
      function updateValidity(point = state.worldPoint) {
        const snapshot = getSnapshot(engine);
        const match = nearestSlot(snapshot, point ?? {}, config.maxSlotDistance ?? 54);
        const blueprint = snapshot?.structures?.blueprints?.[state.blueprintId];
        const occupied = match ? isSlotOccupied(snapshot, match.slot.id) : false;
        const affordable = blueprint ? n(snapshot?.economy?.currency) >= n(blueprint.cost) : false;
        state.worldPoint = point ? clone(point) : null;
        state.slotId = match?.slot?.id ?? null;
        state.rangePreview = blueprint?.range ?? 120;
        state.valid = !!(match && blueprint && !occupied && affordable);
        state.reason = !match ? "outside-build-field" : !blueprint ? "unknown-blueprint" : occupied ? "occupied" : !affordable ? "insufficient-currency" : null;
        return clone(state);
      }
      engine.placementProjector = {
        begin(blueprintId) { state.active = true; state.blueprintId = blueprintId; return updateValidity(state.worldPoint); },
        moveTo(worldPoint) { return updateValidity(worldPoint); },
        confirm(payload = {}) {
          if (!state.active) return { accepted: false, reason: "inactive" };
          updateValidity(state.worldPoint);
          if (!state.valid || !state.slotId) return { accepted: false, reason: state.reason };
          const result = engine.n?.genericDefense?.sessionFacade?.build?.(state.slotId, state.blueprintId, payload) ?? engine.defenseBuild?.build?.(state.slotId, state.blueprintId, payload) ?? engine.genericDefense?.build?.(state.slotId, state.blueprintId, payload);
          state.active = false;
          return { accepted: true, result };
        },
        cancel() { state.active = false; state.blueprintId = null; state.worldPoint = null; state.valid = false; state.reason = null; state.slotId = null; return clone(state); },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericRangeRingKit(NexusEngine, config = {}) {
  const state = { visiblePolicy: "selected-or-placement", selectedOpacity: 0.34, placementOpacity: 0.22, upgradeDeltaOpacity: 0.18, fadeMs: 160, ...(config.state ?? {}) };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-range-ring-kit",
    provides: ["render:range-rings", "selection:range-preview", "upgrade:range-delta-preview"],
    purpose: "Emits selected, placement, and upgrade delta range rings without clutter.",
    install({ engine }) {
      engine.rangeRings = {
        getDescriptors() {
          const snapshot = getSnapshot(engine);
          const session = snapshot?.session ?? {};
          const rings = [];
          const selected = session.selectedKind === "structure" ? snapshot?.structures?.structures?.[session.selectedId] : null;
          if (selected) rings.push({ kind: "range-ring", sourceId: selected.id, x: selected.x, y: selected.y, radius: selected.range, opacity: state.selectedOpacity, style: "selected", color: selected.color });
          const placement = engine.placementProjector?.getSnapshot?.();
          if (placement?.active && placement.worldPoint) rings.push({ kind: "range-ring", sourceId: "placement", x: placement.worldPoint.x, y: placement.worldPoint.y, radius: placement.rangePreview, opacity: state.placementOpacity, style: "placement", color: placement.valid ? "#6bf0b8" : "#ff7a5c" });
          return rings;
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericDefenseUnitRenderKit(NexusEngine, config = {}) {
  const state = { towerScale: 1, enemyScale: 1, bossScale: 1.45, idleBob: true, attackPose: true, healthBarPolicy: "damaged-or-selected", roleIconPolicy: "elite-and-boss", ...(config.state ?? {}) };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-defense-unit-render-kit",
    provides: ["render:unit-descriptors", "render:tower-descriptors", "render:enemy-descriptors"],
    purpose: "Creates renderer-agnostic tower/enemy descriptors with cel material and outline roles.",
    install({ engine }) {
      engine.defenseUnitRender = {
        getDescriptors() {
          const snapshot = getSnapshot(engine);
          const towerDescriptors = Object.values(snapshot?.structures?.structures ?? {}).map((structure) => ({ kind: "unit", entityType: "tower", id: structure.id, towerType: structure.blueprintId, x: structure.x, y: structure.y, z: 18 + n(structure.level) * 2, level: structure.level, materialRole: "tower", outlineRole: "ally", pose: structure.cooldown > 0 ? "recover" : "idle", scale: state.towerScale, color: structure.color, range: structure.range }));
          const enemyDescriptors = Object.values(snapshot?.agents?.active ?? {}).map((enemy) => ({ kind: "unit", entityType: "enemy", id: enemy.id, archetypeId: enemy.archetypeId, x: enemy.x, y: enemy.y, z: enemy.boss ? 16 : 8, health: enemy.health, maxHealth: enemy.maxHealth, materialRole: enemy.boss ? "boss" : "enemy", outlineRole: enemy.boss ? "boss" : "enemy", statusBadges: enemyBadges(enemy), scale: enemy.boss ? state.bossScale : state.enemyScale, color: enemy.color, boss: enemy.boss }));
          return [...towerDescriptors, ...enemyDescriptors];
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericTowerIdentityLayerKit(NexusEngine, config = {}) {
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-tower-identity-layer-kit",
    provides: ["tower:visual-identity", "render:tower-identity-descriptors"],
    purpose: "Maps tower blueprints to silhouettes, motifs, emitters, geometry keys, and VFX keys.",
    install({ engine }) {
      engine.towerIdentity = {
        getIdentity(blueprint = {}) { return { kind: "tower-identity", ...towerIdentityFor(blueprint), upgradeTier: n(blueprint.level, 1), geometryKey: towerIdentityFor(blueprint).silhouette, vfxKey: towerIdentityFor(blueprint).emitter }; },
        getAll() { return Object.fromEntries(sortedEntries(getSnapshot(engine)?.structures?.blueprints ?? {}).map(([id, blueprint]) => [id, this.getIdentity(blueprint)])); }
      };
    }
  });
}

export function createGenericEnemyReadabilityLayerKit(NexusEngine, config = {}) {
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-enemy-readability-layer-kit",
    provides: ["enemy:readability", "render:enemy-badge-descriptors"],
    purpose: "Emits badges and posture descriptors for shield, stealth, split, aura, flying, elite, and boss enemies.",
    install({ engine }) {
      engine.enemyReadability = {
        getDescriptors() { return Object.values(getSnapshot(engine)?.agents?.active ?? {}).map((enemy) => ({ kind: "enemy-readability", enemyId: enemy.id, badges: enemyBadges(enemy), posture: enemy.traversal === "flying" ? "hover" : enemy.speed > 70 ? "forward-lean" : enemy.maxHealth > 250 ? "heavy-step" : "march", threatTier: enemy.boss ? 4 : enemy.maxHealth > 250 ? 3 : 1, elite: enemy.reward > 20, boss: enemy.boss === true })); }
      };
    }
  });
}

export function createGenericCombatVfxKit(NexusEngine, config = {}) {
  const state = { projectileTrails: true, impactBursts: true, deathBursts: true, muzzleFlashes: true, maxActiveVfx: n(config.maxActiveVfx, 180) };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-combat-vfx-kit",
    provides: ["vfx:combat", "render:vfx-descriptors"],
    purpose: "Converts projectiles and combat effects into stylized trail, muzzle, impact, and death-burst descriptors.",
    install({ engine }) {
      engine.combatVfx = {
        getDescriptors() {
          const snapshot = getSnapshot(engine);
          const projectiles = Object.values(snapshot?.combat?.projectiles ?? {}).map((projectile) => ({ kind: "vfx", type: "projectile-trail", id: `trail:${projectile.id}`, x: projectile.x, y: projectile.y, color: projectile.color, radius: 8, lifetime: 0.18, priority: 2 }));
          const effects = (snapshot?.combat?.effects ?? []).map((effect) => ({ kind: "vfx", type: effect.type === "death" ? "death-burst" : effect.type === "muzzle" ? "muzzle-flash" : "impact-burst", id: effect.id, x: effect.x, y: effect.y, color: effect.color, radius: effect.radius ?? 18, lifetime: effect.life ?? 0.35, priority: effect.boss ? 5 : 3 }));
          return [...projectiles, ...effects].slice(0, state.maxActiveVfx);
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericHitFeedbackKit(NexusEngine, config = {}) {
  const state = { damagePips: true, shieldHitStyle: "blue-spark", armorHitStyle: "orange-chip", statusPopStyle: "small-icon", bossHitScale: 1.4 };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-hit-feedback-kit",
    provides: ["feedback:hit", "render:hit-feedback-descriptors"],
    purpose: "Provides clean hit-feedback descriptor policy without raw debug damage numbers.",
    install({ engine }) {
      engine.hitFeedback = {
        getDescriptors() { return (getSnapshot(engine)?.combat?.effects ?? []).filter((effect) => effect.type === "impact" || effect.type === "death").map((effect) => ({ kind: "hit-feedback", targetId: effect.id, feedbackType: effect.type === "death" ? "health" : "impact", x: effect.x, y: effect.y, color: effect.color, lifetime: effect.life ?? 0.32, scale: effect.boss ? state.bossHitScale : 1 })); },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericLayeredHudShellKit(NexusEngine, config = {}) {
  const state = { zones: { topStats: { anchor: "top-center", height: 48 }, towerPalette: { anchor: "bottom-center", height: 112 }, contextPanel: { anchor: "right", width: 320 }, upgradeTree: { anchor: "right", width: 340 } }, theme: "sleek-dark-cel", controlsTextVisible: false, ...(config.state ?? {}) };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-layered-hud-shell-kit",
    provides: ["ui:hud-shell", "ui:layout-zones"],
    purpose: "Defines sleek gameplay-only HUD layout zones and suppresses controls tutorial text.",
    install({ engine }) { engine.layeredHudShell = { getDescriptor() { return { kind: "ui-shell", ...clone(state) }; }, getSnapshot() { return clone(state); } }; }
  });
}

export function createGenericGameplayStatStripKit(NexusEngine, config = {}) {
  const state = { fields: ["wave", "currency", "core", "enemyCount"], compact: true, showControls: false, ...(config.state ?? {}) };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-gameplay-stat-strip-kit",
    provides: ["ui:gameplay-stats"],
    purpose: "Emits only gameplay stats: wave, currency, core, and threats.",
    install({ engine }) {
      engine.gameplayStatStrip = {
        getDescriptor() {
          const snapshot = getSnapshot(engine);
          const hud = snapshot?.render?.hud ?? {};
          return { kind: "ui-stat-strip", fields: [
            { id: "wave", label: "Wave", value: hud.wave ?? "1/1" },
            { id: "currency", label: "CR", value: snapshot?.economy?.currency ?? 0 },
            { id: "core", label: "Core", value: hud.core ?? "--" },
            { id: "enemyCount", label: "Threats", value: Object.keys(snapshot?.agents?.active ?? {}).length + (snapshot?.agents?.spawnQueue?.length ?? 0) }
          ], showControls: false };
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericTowerSelectionPanelKit(NexusEngine, config = {}) {
  const state = { layout: "bottom-card-strip", columns: 12, selectedBlueprintId: null, cardSize: "compact", showCost: true, showRoleIcon: true };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-tower-selection-panel-kit",
    provides: ["ui:tower-selection", "ui:tower-cards"],
    purpose: "Emits compact tower cards for all tower blueprints with cost, role, affordability, and identity icons.",
    install({ engine }) {
      engine.towerSelectionPanel = {
        setSelectedBlueprint(blueprintId) { state.selectedBlueprintId = blueprintId; return blueprintId; },
        getDescriptor() {
          const snapshot = getSnapshot(engine);
          const currency = n(snapshot?.economy?.currency);
          const selectedBlueprintId = state.selectedBlueprintId ?? snapshot?.session?.blueprintId ?? snapshot?.level?.buildOrder?.[0];
          return { kind: "ui-tower-selection-panel", selectedBlueprintId, layout: state.layout, cards: (snapshot?.level?.buildOrder ?? Object.keys(snapshot?.structures?.blueprints ?? {})).map((id) => {
            const blueprint = snapshot?.structures?.blueprints?.[id] ?? snapshot?.level?.blueprints?.[id] ?? { id };
            const identity = towerIdentityFor(blueprint);
            return { id, label: blueprint.label ?? id, cost: blueprint.cost ?? 0, affordable: currency >= n(blueprint.cost), role: blueprint.role ?? "tower", icon: identity.silhouette, color: blueprint.color ?? identity.color, selected: id === selectedBlueprintId };
          }) };
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericUpgradeTreePanelKit(NexusEngine, config = {}) {
  const state = { layout: "right-branch-tree", showStatDelta: true, showSell: true, showRepair: false, maxBranches: 3 };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-upgrade-tree-panel-kit",
    provides: ["ui:upgrade-tree", "structure:upgrade-preview"],
    purpose: "Emits upgrade tree, next stat deltas, affordability, and sell/refund descriptors for selected tower.",
    install({ engine }) {
      engine.upgradeTreePanel = {
        getDescriptor() {
          const snapshot = getSnapshot(engine);
          const selected = getSelected(snapshot);
          if (!selected || !selected.blueprintId) return { kind: "ui-upgrade-tree", empty: true, structureId: null };
          const blueprint = snapshot?.structures?.blueprints?.[selected.blueprintId] ?? {};
          const cost = Math.round(n(blueprint.upgradeCost, 40) * (1 + n(selected.level, 1) * 0.32));
          const affordable = n(snapshot?.economy?.currency) >= cost;
          return { kind: "ui-upgrade-tree", empty: false, structureId: selected.id, currentLevel: selected.level, maxLevel: blueprint.maxLevel ?? 1, branches: [
            { id: "damage", label: "Sharpen", cost, statDeltas: { damage: `+${Math.ceil(n(blueprint.damage, 0) * 0.25)}` }, affordable },
            { id: "tempo", label: "Tempo", cost: Math.ceil(cost * 0.92), statDeltas: { fireRate: "+12%" }, affordable: n(snapshot?.economy?.currency) >= Math.ceil(cost * 0.92) },
            { id: "reach", label: "Reach", cost: Math.ceil(cost * 0.84), statDeltas: { range: "+10" }, affordable: n(snapshot?.economy?.currency) >= Math.ceil(cost * 0.84) }
          ], sell: { refund: Math.round(n(blueprint.cost, 0) * 0.65) } };
        },
        getSnapshot() { return clone(state); }
      };
    }
  });
}

export function createGenericSelectionContextPanelKit(NexusEngine, config = {}) {
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-selection-context-panel-kit",
    provides: ["ui:selection-context"],
    purpose: "Emits selected tower/enemy context panel descriptors.",
    install({ engine }) {
      engine.selectionContextPanel = {
        getDescriptor() {
          const snapshot = getSnapshot(engine);
          const selected = getSelected(snapshot);
          if (!selected) return { kind: "ui-selection-context", visible: false };
          const blueprint = selected.blueprintId ? snapshot?.structures?.blueprints?.[selected.blueprintId] ?? {} : null;
          return { kind: "ui-selection-context", visible: true, selectedId: selected.id, selectedKind: selected.blueprintId ? "tower" : "enemy", title: selected.label ?? blueprint?.label ?? selected.id, stats: selected.blueprintId ? { level: selected.level, damage: selected.damage, range: selected.range, fireRate: selected.fireRate, role: blueprint?.role } : { health: selected.health, maxHealth: selected.maxHealth, speed: selected.speed }, traits: selected.statusBadges ?? [] };
        }
      };
    }
  });
}

export function createGenericUiMotionPolishKit(NexusEngine, config = {}) {
  const state = { easing: "out-cubic", hoverMs: 120, panelOpenMs: 180, statPulseMs: 260, confirmPulseMs: 220, denyShakeMs: 180, lastSelection: null };
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-ui-motion-polish-kit",
    provides: ["ui:motion", "ui:transitions"],
    purpose: "Provides timing descriptors for sleek hover, panel, selection, stat, confirm, and deny motion.",
    install({ engine }) { engine.uiMotionPolish = { getDescriptor(targetId = "ui") { return { kind: "ui-motion", targetId, transition: "soft-pop", durationMs: state.panelOpenMs, easing: state.easing }; }, getSnapshot() { return clone(state); } }; }
  });
}

export function createGenericDefensePresentationStackKit(NexusEngine, config = {}) {
  return makeKit(NexusEngine, {
    id: config.kitId ?? "generic-defense-presentation-stack-kit",
    provides: ["presentation:stack", "render:descriptor-surfaces", "ui:descriptor-surfaces"],
    purpose: "Coordinates all generic 2.5D cel-shaded defense presentation surfaces.",
    install({ engine }) {
      engine.defensePresentationStack = {
        getCameraDescriptor() { return { kind: "camera-2.5d", ...(engine.stylizedView?.getSnapshot?.() ?? {}) }; },
        getRenderDescriptors() { return [
          ...(engine.groundReadability?.getDescriptors?.() ?? []),
          ...(engine.rangeRings?.getDescriptors?.() ?? []),
          ...(engine.defenseUnitRender?.getDescriptors?.() ?? []),
          ...(engine.enemyReadability?.getDescriptors?.() ?? []),
          ...(engine.combatVfx?.getDescriptors?.() ?? []),
          ...(engine.hitFeedback?.getDescriptors?.() ?? [])
        ]; },
        getUiDescriptors() { return [
          engine.layeredHudShell?.getDescriptor?.(),
          engine.gameplayStatStrip?.getDescriptor?.(),
          engine.towerSelectionPanel?.getDescriptor?.(),
          engine.selectionContextPanel?.getDescriptor?.(),
          engine.upgradeTreePanel?.getDescriptor?.(),
          engine.uiMotionPolish?.getDescriptor?.("ui-root")
        ].filter(Boolean); },
        getVfxDescriptors() { return engine.combatVfx?.getDescriptors?.() ?? []; },
        getSnapshot() {
          const rawSnapshot = getSnapshot(engine);
          return {
            version: GENERIC_DEFENSE_PRESENTATION_STACK_VERSION,
            camera: this.getCameraDescriptor(),
            lighting: engine.stylizedLighting?.getLightingDescriptor?.() ?? null,
            materials: engine.celMaterials?.getSnapshot?.() ?? null,
            outlines: engine.inkOutline?.getSnapshot?.() ?? null,
            ground: engine.groundReadability?.getDescriptors?.() ?? [],
            placement: engine.placementProjector?.getSnapshot?.() ?? null,
            rangeRings: engine.rangeRings?.getDescriptors?.() ?? [],
            units: engine.defenseUnitRender?.getDescriptors?.() ?? [],
            towerIdentities: engine.towerIdentity?.getAll?.() ?? {},
            enemies: engine.enemyReadability?.getDescriptors?.() ?? [],
            vfx: engine.combatVfx?.getDescriptors?.() ?? [],
            hitFeedback: engine.hitFeedback?.getDescriptors?.() ?? [],
            ui: this.getUiDescriptors(),
            rawSnapshot
          };
        }
      };
    }
  });
}

export function createGenericDefensePresentationStackKits(NexusEngine, config = {}) {
  return [
    createGenericStylizedViewRigKit(NexusEngine, config.viewRig ?? {}),
    createGenericCelMaterialKit(NexusEngine, config.celMaterials ?? {}),
    createGenericInkOutlineKit(NexusEngine, config.inkOutline ?? {}),
    createGenericStylizedLightingKit(NexusEngine, config.lighting ?? {}),
    createGenericDefenseGroundReadabilityKit(NexusEngine, config.ground ?? {}),
    createGenericPlacementProjectorKit(NexusEngine, config.placement ?? {}),
    createGenericRangeRingKit(NexusEngine, config.rangeRing ?? {}),
    createGenericDefenseUnitRenderKit(NexusEngine, config.units ?? {}),
    createGenericTowerIdentityLayerKit(NexusEngine, config.towerIdentity ?? {}),
    createGenericEnemyReadabilityLayerKit(NexusEngine, config.enemyReadability ?? {}),
    createGenericCombatVfxKit(NexusEngine, config.combatVfx ?? {}),
    createGenericHitFeedbackKit(NexusEngine, config.hitFeedback ?? {}),
    createGenericLayeredHudShellKit(NexusEngine, config.hudShell ?? {}),
    createGenericGameplayStatStripKit(NexusEngine, config.statStrip ?? {}),
    createGenericTowerSelectionPanelKit(NexusEngine, config.towerSelection ?? {}),
    createGenericUpgradeTreePanelKit(NexusEngine, config.upgradeTree ?? {}),
    createGenericSelectionContextPanelKit(NexusEngine, config.selectionContext ?? {}),
    createGenericUiMotionPolishKit(NexusEngine, config.uiMotion ?? {}),
    createGenericDefensePresentationStackKit(NexusEngine, config.stack ?? {})
  ];
}

export default createGenericDefensePresentationStackKits;
