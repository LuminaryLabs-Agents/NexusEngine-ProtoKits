export const FOUND_WEAPON_KIT_VERSION = "0.0.1";

const WEAPONS = Object.freeze([
  { id: "orchard-branch", label: "Splintered Orchard Branch", kind: "melee", rarity: "common", damage: 1, durability: 6, tags: ["breakable", "silent"] },
  { id: "rusty-shovel", label: "Rusty Shovel", kind: "melee", rarity: "common", damage: 2, durability: 14, tags: ["knockback", "breakable"] },
  { id: "pitchfork", label: "Pitchfork", kind: "melee", rarity: "uncommon", damage: 3, durability: 12, tags: ["reach", "pierce", "breakable"] },
  { id: "hatchet", label: "Hatchet", kind: "melee", rarity: "rare", damage: 4, durability: 10, tags: ["cleave", "breakable"] },
  { id: "flare-pistol", label: "Flare Pistol", kind: "ranged", rarity: "rare", damage: 5, ammo: 3, clipSize: 1, durability: 8, tags: ["light", "panic-stun"] },
  { id: "farm-shotgun", label: "Farm Shotgun", kind: "ranged", rarity: "legendary", damage: 8, ammo: 8, clipSize: 2, durability: 18, tags: ["loud", "crowd-control"] },
  { id: "cider-bomb", label: "Fermenting Cider Bomb", kind: "thrown", rarity: "uncommon", damage: 6, ammo: 1, durability: 1, temporary: true, expiresAfterUses: 1, tags: ["area", "temporary"] }
]);

const n = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const i = (value, fallback = 0) => Math.max(0, Math.floor(n(value, fallback)));

function runtime(nexusRealtime) {
  const missing = ["defineRuntimeKit", "defineResource", "defineEvent", "defineComponent"].filter((name) => typeof nexusRealtime?.[name] !== "function");
  if (missing.length) throw new TypeError(`createFoundWeaponKit requires NexusRealtime helpers: ${missing.join(", ")}`);
  return nexusRealtime;
}

function namespace(engine) {
  if (!engine.zombieOrchard) engine.zombieOrchard = {};
  return engine.zombieOrchard;
}

function table(config) {
  return Object.fromEntries([...WEAPONS, ...(config.weapons ?? [])].map((weapon) => [weapon.id, { ...weapon }]));
}

function pickup(weaponId, source = {}, index = 0) {
  return {
    id: source.id ?? `weapon-pickup-${weaponId}-${index}`,
    weaponId,
    position: { x: n(source.position?.x ?? source.x), z: n(source.position?.z ?? source.z ?? source.y) },
    active: source.active !== false,
    rarity: source.rarity,
    tags: source.tags ?? [],
    replacementSeconds: source.replacementSeconds
  };
}

function initialState(config) {
  const weaponTable = table(config);
  const pickups = (config.pickups?.length ? config.pickups : Object.keys(weaponTable).slice(0, 5).map((weaponId, index) => ({ weaponId, position: { x: (index - 2) * 4, z: 6 + index * 2 }, replacementSeconds: 18 + index * 3 })))
    .map((entry, index) => pickup(entry.weaponId ?? entry.id, entry, index));
  return { id: config.id ?? "zombie-orchard-found-weapons", weaponTable, inventory: [...(config.initialInventory ?? [])], equippedId: config.equippedId ?? null, pickups, replacementQueue: [], recentActions: [] };
}

const emptyInput = () => ({ commands: [] });
const recent = (state, action) => ({ ...state, recentActions: [...(state.recentActions ?? []), action].slice(-18) });

function instance(definition, source = {}, sequence = 0) {
  return {
    instanceId: source.instanceId ?? `${definition.id}-${sequence}-${Math.floor(Math.random() * 100000)}`,
    weaponId: definition.id,
    label: definition.label,
    kind: definition.kind,
    rarity: source.rarity ?? definition.rarity,
    damage: n(source.damage ?? definition.damage, 1),
    durability: definition.durability === undefined ? null : n(source.durability ?? definition.durability, definition.durability),
    ammo: definition.ammo === undefined ? null : i(source.ammo ?? definition.ammo, definition.ammo),
    clipSize: definition.clipSize === undefined ? null : i(source.clipSize ?? definition.clipSize, definition.clipSize),
    temporary: Boolean(source.temporary ?? definition.temporary),
    usesRemaining: definition.expiresAfterUses === undefined ? null : i(source.usesRemaining ?? definition.expiresAfterUses, definition.expiresAfterUses),
    tags: [...(definition.tags ?? []), ...(source.tags ?? [])],
    sourcePickupId: source.id ?? null
  };
}

function stepQueue(state, delta) {
  const pickups = [...(state.pickups ?? [])];
  const replacementQueue = [];
  for (const item of state.replacementQueue ?? []) {
    const remaining = n(item.remaining) - delta;
    if (remaining <= 0) {
      const index = pickups.findIndex((entry) => entry.id === item.pickupId);
      if (index !== -1) pickups[index] = { ...pickups[index], active: true };
    } else {
      replacementQueue.push({ ...item, remaining });
    }
  }
  return { ...state, pickups, replacementQueue };
}

function pickupCommand(command, state, world, D, config) {
  const item = (state.pickups ?? []).find((entry) => entry.id === (command.pickupId ?? command.id) && entry.active !== false);
  if (!item || !state.weaponTable[item.weaponId]) return state;
  const weapon = instance(state.weaponTable[item.weaponId], item, (state.inventory ?? []).length);
  let inventory = [...(state.inventory ?? [])];
  let dropped = null;
  if (inventory.length >= i(config.inventoryLimit, 3)) {
    dropped = inventory.shift();
    world.emit(D.WeaponDropped, { weapon: dropped, reason: "inventory-limit" });
  }
  inventory.push(weapon);
  const pickups = state.pickups.map((entry) => entry.id === item.id ? { ...entry, active: false } : entry);
  const replacementSeconds = n(item.replacementSeconds ?? config.defaultReplacementSeconds, 20);
  const replacementQueue = replacementSeconds > 0 ? [...(state.replacementQueue ?? []), { pickupId: item.id, remaining: replacementSeconds }] : state.replacementQueue ?? [];
  const equippedId = state.equippedId ?? weapon.instanceId;
  world.emit(D.WeaponPickedUp, { weapon, pickup: item, dropped, equipped: equippedId === weapon.instanceId });
  return recent({ ...state, inventory, pickups, replacementQueue, equippedId }, { type: "pickup", weaponId: weapon.weaponId, pickupId: item.id });
}

function swapCommand(command, state, world, D) {
  const target = command.instanceId ?? command.weaponId;
  const weapon = (state.inventory ?? []).find((entry) => entry.instanceId === target || entry.weaponId === target);
  if (!weapon) return state;
  world.emit(D.WeaponSwapped, { weapon });
  return recent({ ...state, equippedId: weapon.instanceId }, { type: "swap", weaponId: weapon.weaponId });
}

function useCommand(command, state, world, D) {
  const equipped = (state.inventory ?? []).find((weapon) => weapon.instanceId === state.equippedId);
  if (!equipped) return state;
  let weapon = { ...equipped };
  let dryFire = false;
  if (weapon.ammo !== null && weapon.ammo !== undefined) {
    if (weapon.ammo <= 0) dryFire = true;
    else {
      weapon.ammo = Math.max(0, i(weapon.ammo) - i(command.ammoCost, 1));
      world.emit(D.AmmoChanged, { weapon, ammo: weapon.ammo });
    }
  }
  if (!dryFire && weapon.durability !== null && weapon.durability !== undefined) weapon.durability = Math.max(0, n(weapon.durability) - n(command.durabilityCost, 1));
  if (!dryFire && weapon.usesRemaining !== null && weapon.usesRemaining !== undefined) weapon.usesRemaining = Math.max(0, i(weapon.usesRemaining) - 1);
  world.emit(D.WeaponUsed, { weapon, dryFire, target: command.target ?? null, tags: weapon.tags });
  let inventory = state.inventory.map((entry) => entry.instanceId === weapon.instanceId ? weapon : entry);
  let equippedId = state.equippedId;
  const broken = !dryFire && ((weapon.durability !== null && weapon.durability !== undefined && weapon.durability <= 0) || (weapon.usesRemaining !== null && weapon.usesRemaining !== undefined && weapon.usesRemaining <= 0));
  if (broken) {
    inventory = inventory.filter((entry) => entry.instanceId !== weapon.instanceId);
    equippedId = inventory[0]?.instanceId ?? null;
    world.emit(D.WeaponBroken, { weapon });
  }
  return recent({ ...state, inventory, equippedId }, { type: dryFire ? "dry-fire" : "use", weaponId: weapon.weaponId, broken });
}

export function createFoundWeaponKit(nexusRealtime = {}, options = {}) {
  const r = runtime(nexusRealtime);
  const D = {
    WeaponPickup: r.defineComponent("zombie-orchard.weapon-pickup"),
    WeaponCarrier: r.defineComponent("zombie-orchard.weapon-carrier"),
    FoundWeaponState: r.defineResource("zombie-orchard.found-weapon.state"),
    FoundWeaponInput: r.defineResource("zombie-orchard.found-weapon.input"),
    WeaponPickedUp: r.defineEvent("zombie-orchard.weapon.picked-up"),
    WeaponSwapped: r.defineEvent("zombie-orchard.weapon.swapped"),
    WeaponUsed: r.defineEvent("zombie-orchard.weapon.used"),
    WeaponBroken: r.defineEvent("zombie-orchard.weapon.broken"),
    WeaponDropped: r.defineEvent("zombie-orchard.weapon.dropped"),
    AmmoChanged: r.defineEvent("zombie-orchard.weapon.ammo-changed")
  };

  function system(world) {
    let state = stepQueue(world.getResource(D.FoundWeaponState) ?? initialState(options), n(world.__nexusClock?.delta, 1 / 60));
    const input = world.getResource(D.FoundWeaponInput) ?? emptyInput();
    for (const command of input.commands ?? []) {
      if (command?.type === "pickup") state = pickupCommand(command, state, world, D, options);
      if (command?.type === "swap") state = swapCommand(command, state, world, D);
      if (command?.type === "use") state = useCommand(command, state, world, D);
      if (command?.type === "spawn-pickup" && state.weaponTable[command.weaponId]) state = recent({ ...state, pickups: [...state.pickups, pickup(command.weaponId, command.pickup ?? command, state.pickups.length)] }, { type: "spawn-pickup", weaponId: command.weaponId });
      if (command?.type === "replace-pickup") state = recent({ ...state, pickups: state.pickups.map((entry) => entry.id === (command.pickupId ?? command.id) ? { ...entry, weaponId: command.weaponId ?? entry.weaponId, active: true, ...(command.pickup ?? {}) } : entry) }, { type: "replace-pickup", pickupId: command.pickupId ?? command.id });
    }
    world.setResource(D.FoundWeaponState, state);
    world.setResource(D.FoundWeaponInput, emptyInput());
  }

  return r.defineRuntimeKit({
    id: options.id ?? "zombie-orchard-found-weapon-kit",
    components: { WeaponPickup: D.WeaponPickup, WeaponCarrier: D.WeaponCarrier },
    resources: { FoundWeaponState: D.FoundWeaponState, FoundWeaponInput: D.FoundWeaponInput },
    events: { WeaponPickedUp: D.WeaponPickedUp, WeaponSwapped: D.WeaponSwapped, WeaponUsed: D.WeaponUsed, WeaponBroken: D.WeaponBroken, WeaponDropped: D.WeaponDropped, AmmoChanged: D.AmmoChanged },
    systems: [{ phase: "input", name: "ZombieOrchardFoundWeaponSystem", system }],
    provides: ["zombie-orchard.weapons"],
    initWorld({ world }) {
      world.setResource(D.FoundWeaponState, initialState(options));
      world.setResource(D.FoundWeaponInput, emptyInput());
    },
    install({ engine }) {
      const api = namespace(engine).foundWeapons = {
        definitions: D,
        getState: () => engine.world.getResource(D.FoundWeaponState),
        feedInput(commandOrCommands) {
          const commands = Array.isArray(commandOrCommands) ? commandOrCommands : [commandOrCommands];
          const input = engine.world.getResource(D.FoundWeaponInput) ?? emptyInput();
          const next = { commands: [...(input.commands ?? []), ...commands.filter(Boolean)] };
          engine.world.setResource(D.FoundWeaponInput, next);
          return next;
        }
      };
      api.pickup = (pickupId) => api.feedInput({ type: "pickup", pickupId });
      api.swap = (instanceId) => api.feedInput({ type: "swap", instanceId });
      api.use = (payload = {}) => api.feedInput({ type: "use", ...payload });
      api.spawnPickup = (weaponId, pickupData = {}) => api.feedInput({ type: "spawn-pickup", weaponId, pickup: pickupData });
      api.replacePickup = (pickupId, payload = {}) => api.feedInput({ type: "replace-pickup", pickupId, ...payload });
    },
    metadata: { version: FOUND_WEAPON_KIT_VERSION, domain: "zombie-orchard", purpose: "Scavenged weapons, ammo, durability, rarity, swapping, replacement, temporary weapons, and breakage." }
  });
}

export const foundWeaponKitResources = Object.freeze({ FoundWeaponState: "zombie-orchard.found-weapon.state", FoundWeaponInput: "zombie-orchard.found-weapon.input" });
export const foundWeaponKitEvents = Object.freeze({ WeaponPickedUp: "zombie-orchard.weapon.picked-up", WeaponSwapped: "zombie-orchard.weapon.swapped", WeaponUsed: "zombie-orchard.weapon.used", WeaponBroken: "zombie-orchard.weapon.broken", WeaponDropped: "zombie-orchard.weapon.dropped", AmmoChanged: "zombie-orchard.weapon.ammo-changed" });
export const foundWeaponDefaults = Object.freeze({ weapons: WEAPONS });
