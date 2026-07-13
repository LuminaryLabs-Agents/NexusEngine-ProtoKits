import { createGenericDefenseDskBundle } from "../generic-defense-dsk-boundaries/index.js";

export const SEMANTIC_DOMAIN_KITS_VERSION = "0.1.0";
const clone = (v) => v === undefined ? undefined : typeof structuredClone === "function" ? structuredClone(v) : JSON.parse(JSON.stringify(v));
const list = (v) => Array.isArray(v) ? v : v == null ? [] : [v];
const number = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const id = (v, label = "Value") => {
  const next = String(v ?? "").trim();
  if (!next) throw new TypeError(`${label} requires a stable id.`);
  return next;
};

export const SEMANTIC_DOMAIN_FAMILIES = Object.freeze({
  production: { id: "production", domains: ["agriculture", "foraging", "crafting", "manufacturing", "processing"] },
  mobility: { id: "mobility", domains: ["traversal", "transport", "navigation"] },
  infrastructure: { id: "infrastructure", domains: ["construction", "utilities", "restoration"] },
  conflict: { id: "conflict", domains: ["combat", "defense", "survival"] },
  world: { id: "world", domains: ["environment", "ecology", "settlement"] },
  agency: { id: "agency", domains: ["character", "interaction", "social", "agent-intelligence"] },
  knowledge: { id: "knowledge", domains: ["investigation", "authoring", "model-workbench"] }
});
export const listSemanticDomainFamilies = () => Object.values(SEMANTIC_DOMAIN_FAMILIES).map(clone);
export const getSemanticDomainFamily = (familyId) => clone(SEMANTIC_DOMAIN_FAMILIES[String(familyId)] ?? null);

function requireNexus(NexusEngine, name) {
  for (const key of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") throw new TypeError(`${name} requires NexusEngine.${key}.`);
  }
}

function createSemanticDsk(NexusEngine, spec, config, initialState, createServices) {
  requireNexus(NexusEngine, spec.factory);
  const Resource = NexusEngine.defineResource(config.resourceName ?? `${spec.path.slice(2).replaceAll(":", ".")}.state`);
  const events = Object.fromEntries(spec.events.map((eventName) => [eventName, NexusEngine.defineEvent(`${spec.domain}.${eventName}`)]));
  return NexusEngine.defineDomainServiceKit({
    id: config.id ?? spec.kitId,
    domain: spec.domain,
    domainPath: spec.path,
    parentDomainPath: spec.parent,
    apiName: config.apiName ?? spec.api,
    version: SEMANTIC_DOMAIN_KITS_VERSION,
    stability: config.stability ?? "protokit",
    services: spec.services,
    provides: spec.provides,
    requires: config.requires ?? [],
    resources: { State: Resource },
    events,
    metadata: {
      purpose: spec.purpose,
      family: spec.family,
      rendererAgnostic: true,
      deterministic: true,
      contentDefined: spec.contentDefined !== false,
      ...(spec.metadata ?? {}),
      ...(config.metadata ?? {})
    },
    initWorld({ world }) { world.setResource(Resource, clone(initialState)); },
    createApi({ engine, world }) {
      const read = () => world.getResource(Resource) ?? clone(initialState);
      const write = (state) => {
        world.setResource(Resource, state);
        return clone(state);
      };
      const emit = (eventName, payload) => world.emit(events[eventName], clone(payload));
      const commit = (result, transform = (state) => state, eventName = null) => {
        const current = read();
        const next = transform(clone(current));
        const state = {
          ...next,
          revision: number(current.revision, 0) + 1,
          lastResult: clone(result),
          journal: [...list(current.journal), clone(result)].slice(-128)
        };
        write(state);
        if (eventName) emit(eventName, result);
        return clone(result);
      };
      const reject = (reason, payload = {}) => commit({ ok: false, reason, ...clone(payload) }, undefined, "command.rejected");
      return Object.freeze({
        ...createServices({ engine, world, read, write, commit, reject, emit, config }),
        getState: () => clone(read()),
        getSnapshot: () => clone(read()),
        reset() {
          write(clone(initialState));
          emit("reset", { revision: initialState.revision });
          return clone(initialState);
        }
      });
    }
  });
}

function route(input = {}, index = 0) {
  const routeId = id(input.id ?? `route-${index + 1}`, "Traversal route");
  const nodes = list(input.nodes ?? input.checkpoints).map((node, nodeIndex) => ({
    id: id(node.id ?? `node-${nodeIndex + 1}`, "Traversal node"),
    label: String(node.label ?? node.id ?? `Node ${nodeIndex + 1}`),
    order: number(node.order, nodeIndex),
    required: node.required !== false,
    position: clone(node.position ?? null),
    tags: list(node.tags).map(String),
    metadata: clone(node.metadata ?? {})
  })).sort((a, b) => a.order - b.order);
  return { id: routeId, label: String(input.label ?? routeId), kind: String(input.kind ?? "route"), nodes, metadata: clone(input.metadata ?? {}) };
}

export const MOBILITY_TRAVERSAL_DOMAIN_PATH = "n:mobility:traversal";
export function createMobilityTraversalDomainKit(NexusEngine, config = {}) {
  const routes = Object.fromEntries(list(config.routes).map((entry, index) => {
    const value = route(entry, index);
    return [value.id, value];
  }));
  const initial = { schema: "nexusengine.mobility.traversal/1", version: SEMANTIC_DOMAIN_KITS_VERSION, routes, journeys: {}, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createMobilityTraversalDomainKit", kitId: "mobility-traversal-domain-kit",
    domain: "traversal", path: MOBILITY_TRAVERSAL_DOMAIN_PATH, parent: "n:mobility", api: "traversal", family: "mobility",
    purpose: "Bounded mobility authority for routes, journeys, passages, constraints, and progress.",
    services: ["network", "journey", "passage", "progress", "descriptors", "snapshot", "reset"],
    provides: ["mobility:traversal", "traversal:routes", "traversal:journeys"],
    events: ["route.registered", "journey.began", "node.entered", "node.completed", "journey.completed", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject, emit }) => {
    const getRoute = (routeId) => read().routes[String(routeId)] ?? null;
    const getJourney = (journeyId) => read().journeys[String(journeyId)] ?? null;
    const register = (input) => {
      const value = route(input);
      if (getRoute(value.id)) return reject("route-already-registered", { routeId: value.id });
      commit({ ok: true, action: "register-route", routeId: value.id }, (state) => ({ ...state, routes: { ...state.routes, [value.id]: value } }), "route.registered");
      return clone(value);
    };
    const begin = (input = {}) => {
      const journeyId = id(input.id, "Journey");
      const value = getRoute(input.routeId);
      if (!value) return reject("unknown-route", { routeId: input.routeId, journeyId });
      if (getJourney(journeyId)) return reject("journey-already-exists", { journeyId });
      const first = value.nodes[0] ?? null;
      const journey = { id: journeyId, routeId: value.id, actorId: String(input.actorId ?? "actor"), status: first ? "active" : "completed", activeNodeId: first?.id ?? null, completedNodeIds: [], metadata: clone(input.metadata ?? {}), revision: 1 };
      commit({ ok: true, action: "begin-journey", journeyId, routeId: value.id }, (state) => ({ ...state, journeys: { ...state.journeys, [journeyId]: journey } }), "journey.began");
      return clone(journey);
    };
    const enter = (journeyId, nodeId) => {
      const journey = getJourney(journeyId);
      if (!journey) return reject("unknown-journey", { journeyId });
      const value = getRoute(journey.routeId);
      const node = value.nodes.find((entry) => entry.id === String(nodeId));
      if (!node) return reject("unknown-node", { journeyId, nodeId });
      const next = { ...journey, activeNodeId: node.id, revision: journey.revision + 1 };
      commit({ ok: true, action: "enter-node", journeyId, nodeId: node.id }, (state) => ({ ...state, journeys: { ...state.journeys, [journeyId]: next } }), "node.entered");
      return clone(next);
    };
    const complete = (journeyId, nodeId, options = {}) => {
      const journey = getJourney(journeyId);
      if (!journey) return reject("unknown-journey", { journeyId });
      const value = getRoute(journey.routeId);
      const target = String(nodeId ?? journey.activeNodeId);
      const node = value.nodes.find((entry) => entry.id === target);
      if (!node) return reject("unknown-node", { journeyId, nodeId: target });
      if (journey.completedNodeIds.includes(target)) return { ok: true, duplicate: true, journey: clone(journey) };
      const expected = value.nodes.find((entry) => !journey.completedNodeIds.includes(entry.id));
      if (!options.allowOutOfOrder && expected?.id !== target) return reject("node-out-of-order", { journeyId, nodeId: target, expectedNodeId: expected?.id ?? null });
      const completedNodeIds = [...journey.completedNodeIds, target];
      const nextNode = value.nodes.find((entry) => !completedNodeIds.includes(entry.id)) ?? null;
      const next = { ...journey, completedNodeIds, activeNodeId: nextNode?.id ?? null, status: nextNode ? "active" : "completed", revision: journey.revision + 1 };
      commit({ ok: true, action: "complete-node", journeyId, nodeId: target, completed: !nextNode }, (state) => ({ ...state, journeys: { ...state.journeys, [journeyId]: next } }), "node.completed");
      if (!nextNode) emit("journey.completed", { journeyId, routeId: journey.routeId });
      return clone(next);
    };
    const descriptors = () => Object.values(read().journeys).sort((a, b) => a.id.localeCompare(b.id)).map((journey) => {
      const value = getRoute(journey.routeId);
      return { id: journey.id, kind: "mobility-journey", routeId: journey.routeId, actorId: journey.actorId, status: journey.status, activeNodeId: journey.activeNodeId, completedNodeIds: [...journey.completedNodeIds], progress: value?.nodes.length ? journey.completedNodeIds.length / value.nodes.length : 0 };
    });
    return {
      network: Object.freeze({ register, get: (routeId) => clone(getRoute(routeId)), list: () => Object.values(read().routes).map(clone) }),
      journey: Object.freeze({ begin, get: (journeyId) => clone(getJourney(journeyId)), list: () => Object.values(read().journeys).map(clone) }),
      passage: Object.freeze({ enter, complete }),
      progress: Object.freeze({ get: (journeyId) => descriptors().find((entry) => entry.id === String(journeyId)) ?? null }),
      getDescriptors: descriptors
    };
  });
}

export const INFRASTRUCTURE_RESTORATION_DOMAIN_PATH = "n:infrastructure:restoration";
export function createInfrastructureRestorationDomainKit(NexusEngine, config = {}) {
  const normalizeAsset = (input = {}, index = 0) => ({
    id: id(input.id ?? `asset-${index + 1}`, "Infrastructure asset"),
    label: String(input.label ?? input.id ?? `Asset ${index + 1}`),
    kind: String(input.kind ?? "infrastructure"),
    condition: String(input.condition ?? "degraded"),
    operational: Boolean(input.operational),
    requirements: list(input.requirements).map((entry) => ({ id: id(entry.id ?? entry.kind, "Restoration requirement"), required: Math.max(0, number(entry.required ?? entry.amount, 1)), supplied: Math.max(0, number(entry.supplied, 0)) })),
    dependencies: list(input.dependencies).map(String),
    metadata: clone(input.metadata ?? {}),
    revision: 1
  });
  const assets = Object.fromEntries(list(config.assets).map((entry, index) => {
    const value = normalizeAsset(entry, index);
    return [value.id, value];
  }));
  const initial = { schema: "nexusengine.infrastructure.restoration/1", version: SEMANTIC_DOMAIN_KITS_VERSION, assets, plans: {}, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createInfrastructureRestorationDomainKit", kitId: "infrastructure-restoration-domain-kit",
    domain: "restoration", path: INFRASTRUCTURE_RESTORATION_DOMAIN_PATH, parent: "n:infrastructure", api: "restoration", family: "infrastructure",
    purpose: "Bounded infrastructure authority for diagnosis, restoration plans, work requirements, and commissioning.",
    services: ["assets", "diagnosis", "planning", "work", "commissioning", "descriptors", "snapshot", "reset"],
    provides: ["infrastructure:restoration", "restoration:plans", "restoration:commissioning"],
    events: ["asset.registered", "asset.diagnosed", "plan.created", "work.contributed", "asset.commissioned", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => {
    const asset = (assetId) => read().assets[String(assetId)] ?? null;
    const register = (input) => {
      const value = normalizeAsset(input);
      if (asset(value.id)) return reject("asset-already-registered", { assetId: value.id });
      commit({ ok: true, action: "register-asset", assetId: value.id }, (state) => ({ ...state, assets: { ...state.assets, [value.id]: value } }), "asset.registered");
      return clone(value);
    };
    const diagnose = (assetId, diagnosis = {}) => {
      const value = asset(assetId);
      if (!value) return reject("unknown-asset", { assetId });
      const next = { ...value, condition: String(diagnosis.condition ?? value.condition), requirements: diagnosis.requirements ? normalizeAsset({ ...value, requirements: diagnosis.requirements }).requirements : value.requirements, revision: value.revision + 1 };
      commit({ ok: true, action: "diagnose", assetId: value.id }, (state) => ({ ...state, assets: { ...state.assets, [value.id]: next } }), "asset.diagnosed");
      return clone(next);
    };
    const plan = (assetId, options = {}) => {
      const value = asset(assetId);
      if (!value) return reject("unknown-asset", { assetId });
      const planId = id(options.id ?? `restore-${value.id}`, "Restoration plan");
      const next = { id: planId, assetId: value.id, status: value.operational ? "completed" : "active", metadata: clone(options.metadata ?? {}), revision: 1 };
      commit({ ok: true, action: "create-plan", planId, assetId: value.id }, (state) => ({ ...state, plans: { ...state.plans, [planId]: next } }), "plan.created");
      return clone(next);
    };
    const contribute = (planId, requirementId, amount = 1) => {
      const state = read();
      const restorationPlan = state.plans[String(planId)];
      if (!restorationPlan) return reject("unknown-plan", { planId });
      const value = state.assets[restorationPlan.assetId];
      if (!value.requirements.some((entry) => entry.id === String(requirementId))) return reject("unknown-requirement", { planId, requirementId });
      const requirements = value.requirements.map((entry) => entry.id === String(requirementId) ? { ...entry, supplied: Math.min(entry.required, entry.supplied + Math.max(0, number(amount))) } : entry);
      const ready = requirements.every((entry) => entry.supplied >= entry.required);
      const nextAsset = { ...value, requirements, condition: ready ? "restored" : value.condition, revision: value.revision + 1 };
      const nextPlan = { ...restorationPlan, status: ready ? "ready-to-commission" : "active", revision: restorationPlan.revision + 1 };
      const result = { ok: true, action: "contribute-work", planId, assetId: value.id, requirementId, ready };
      commit(result, (current) => ({ ...current, assets: { ...current.assets, [value.id]: nextAsset }, plans: { ...current.plans, [planId]: nextPlan } }), "work.contributed");
      return clone(result);
    };
    const commission = (planId) => {
      const state = read();
      const restorationPlan = state.plans[String(planId)];
      if (!restorationPlan) return reject("unknown-plan", { planId });
      const value = state.assets[restorationPlan.assetId];
      if (!value.requirements.every((entry) => entry.supplied >= entry.required)) return reject("requirements-incomplete", { planId, assetId: value.id });
      const blocked = value.dependencies.find((dependencyId) => !state.assets[dependencyId]?.operational);
      if (blocked) return reject("dependency-not-operational", { planId, assetId: value.id, dependencyId: blocked });
      const nextAsset = { ...value, condition: "operational", operational: true, revision: value.revision + 1 };
      const nextPlan = { ...restorationPlan, status: "completed", revision: restorationPlan.revision + 1 };
      commit({ ok: true, action: "commission", planId, assetId: value.id }, (current) => ({ ...current, assets: { ...current.assets, [value.id]: nextAsset }, plans: { ...current.plans, [planId]: nextPlan } }), "asset.commissioned");
      return clone(nextAsset);
    };
    const descriptors = () => Object.values(read().assets).map((value) => {
      const required = value.requirements.reduce((sum, entry) => sum + entry.required, 0);
      const supplied = value.requirements.reduce((sum, entry) => sum + Math.min(entry.required, entry.supplied), 0);
      return { id: value.id, kind: "restoration-asset", label: value.label, assetKind: value.kind, condition: value.condition, operational: value.operational, readiness: required ? supplied / required : value.operational ? 1 : 0 };
    });
    return {
      assets: Object.freeze({ register, get: (assetId) => clone(asset(assetId)), list: () => Object.values(read().assets).map(clone) }),
      diagnosis: Object.freeze({ inspect: (assetId) => clone(asset(assetId)), apply: diagnose }),
      planning: Object.freeze({ create: plan, get: (planId) => clone(read().plans[String(planId)] ?? null), list: () => Object.values(read().plans).map(clone) }),
      work: Object.freeze({ contribute }),
      commissioning: Object.freeze({ commission }),
      getDescriptors: descriptors
    };
  });
}

export const WORLD_ENVIRONMENT_DOMAIN_PATH = "n:world:environment";
export function createWorldEnvironmentDomainKit(NexusEngine, config = {}) {
  const normalizeRegion = (input = {}, index = 0) => ({
    id: id(input.id ?? `region-${index + 1}`, "Environment region"),
    label: String(input.label ?? input.id ?? `Region ${index + 1}`),
    kind: String(input.kind ?? "environment-region"),
    fields: Object.fromEntries(list(input.fields).map((entry) => {
      const fieldId = id(entry.id ?? entry.kind, "Environment field");
      return [fieldId, { id: fieldId, kind: String(entry.kind ?? fieldId), value: number(entry.value), min: number(entry.min), max: number(entry.max, 1), rate: number(entry.rate), tags: list(entry.tags).map(String), providerRef: clone(entry.providerRef ?? null) }];
    })),
    providerRefs: list(input.providerRefs).map(clone),
    metadata: clone(input.metadata ?? {}),
    revision: 1
  });
  const regions = Object.fromEntries(list(config.regions).map((entry, index) => {
    const value = normalizeRegion(entry, index);
    return [value.id, value];
  }));
  const initial = { schema: "nexusengine.world.environment/1", version: SEMANTIC_DOMAIN_KITS_VERSION, time: number(config.initialTime), regions, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createWorldEnvironmentDomainKit", kitId: "world-environment-domain-kit",
    domain: "environment", path: WORLD_ENVIRONMENT_DOMAIN_PATH, parent: "n:world", api: "environment", family: "world",
    purpose: "Portable environment authority for regions, conditions, effect fields, provider references, and time evolution.",
    services: ["regions", "fields", "conditions", "providers", "time", "descriptors", "snapshot", "reset"],
    provides: ["world:environment", "environment:regions", "environment:fields"],
    events: ["region.registered", "field.changed", "time.advanced", "command.rejected", "reset"],
    metadata: { heavyStateOwnedByProviders: true }
  }, config, initial, ({ read, commit, reject }) => {
    const region = (regionId) => read().regions[String(regionId)] ?? null;
    const register = (input) => {
      const value = normalizeRegion(input);
      if (region(value.id)) return reject("region-already-registered", { regionId: value.id });
      commit({ ok: true, action: "register-region", regionId: value.id }, (state) => ({ ...state, regions: { ...state.regions, [value.id]: value } }), "region.registered");
      return clone(value);
    };
    const setField = (regionId, input = {}) => {
      const value = region(regionId);
      if (!value) return reject("unknown-region", { regionId });
      const fieldId = id(input.id ?? input.kind, "Environment field");
      const previous = value.fields[fieldId] ?? {};
      const field = { id: fieldId, kind: String(input.kind ?? previous.kind ?? fieldId), value: number(input.value, previous.value), min: number(input.min, previous.min), max: number(input.max, previous.max ?? 1), rate: number(input.rate, previous.rate), tags: list(input.tags ?? previous.tags).map(String), providerRef: clone(input.providerRef ?? previous.providerRef ?? null) };
      const next = { ...value, fields: { ...value.fields, [fieldId]: field }, revision: value.revision + 1 };
      commit({ ok: true, action: "set-field", regionId: value.id, fieldId, value: field.value }, (state) => ({ ...state, regions: { ...state.regions, [value.id]: next } }), "field.changed");
      return clone(field);
    };
    const advance = (delta = 0) => {
      const dt = Math.max(0, number(delta));
      commit({ ok: true, action: "advance-time", delta: dt }, (state) => ({
        ...state,
        time: state.time + dt,
        regions: Object.fromEntries(Object.entries(state.regions).map(([regionId, value]) => [regionId, {
          ...value,
          fields: Object.fromEntries(Object.entries(value.fields).map(([fieldId, field]) => [fieldId, { ...field, value: Math.max(field.min, Math.min(field.max, field.value + field.rate * dt)) }]))
        }]))
      }), "time.advanced");
      return read().time;
    };
    return {
      regions: Object.freeze({ register, get: (regionId) => clone(region(regionId)), list: () => Object.values(read().regions).map(clone) }),
      fields: Object.freeze({ set: setField, get: (regionId, fieldId) => clone(region(regionId)?.fields?.[String(fieldId)] ?? null), list: (regionId) => Object.values(region(regionId)?.fields ?? {}).map(clone) }),
      conditions: Object.freeze({ inspect: (regionId) => clone(region(regionId)?.fields ?? null) }),
      providers: Object.freeze({ list: (regionId) => clone(region(regionId)?.providerRefs ?? []) }),
      time: Object.freeze({ advance, now: () => read().time }),
      getDescriptors: () => Object.values(read().regions).map((value) => ({ id: value.id, kind: "environment-region", label: value.label, regionKind: value.kind, fields: Object.values(value.fields).map(clone), providerRefs: clone(value.providerRefs) }))
    };
  });
}

export const AGENCY_CHARACTER_DOMAIN_PATH = "n:agency:character";
export function createAgencyCharacterDomainKit(NexusEngine, config = {}) {
  const normalizeCharacter = (input = {}, index = 0) => ({
    id: id(input.id ?? `character-${index + 1}`, "Character"),
    label: String(input.label ?? input.id ?? `Character ${index + 1}`),
    kind: String(input.kind ?? "character"),
    roles: list(input.roles).map(String),
    capabilities: Array.from(new Set(list(input.capabilities).map(String))).sort(),
    conditions: clone(input.conditions ?? {}),
    controller: clone(input.controller ?? null),
    references: clone(input.references ?? {}),
    status: String(input.status ?? "active"),
    metadata: clone(input.metadata ?? {}),
    revision: 1
  });
  const characters = Object.fromEntries(list(config.characters).map((entry, index) => {
    const value = normalizeCharacter(entry, index);
    return [value.id, value];
  }));
  const initial = { schema: "nexusengine.agency.character/1", version: SEMANTIC_DOMAIN_KITS_VERSION, characters, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createAgencyCharacterDomainKit", kitId: "agency-character-domain-kit",
    domain: "character", path: AGENCY_CHARACTER_DOMAIN_PATH, parent: "n:agency", api: "character", family: "agency",
    purpose: "Bounded agency authority for character identity, roles, capabilities, conditions, control, and references.",
    services: ["identity", "roles", "capabilities", "conditions", "control", "references", "descriptors", "snapshot", "reset"],
    provides: ["agency:character", "character:capabilities", "character:control"],
    events: ["registered", "controller.assigned", "capability.granted", "capability.revoked", "condition.changed", "status.changed", "command.rejected", "reset"],
    metadata: { doesNotOwn: ["motion", "physics", "inventory contents", "agent policy", "renderer objects"] }
  }, config, initial, ({ read, commit, reject }) => {
    const character = (characterId) => read().characters[String(characterId)] ?? null;
    const register = (input) => {
      const value = normalizeCharacter(input);
      if (character(value.id)) return reject("character-already-registered", { characterId: value.id });
      commit({ ok: true, action: "register-character", characterId: value.id }, (state) => ({ ...state, characters: { ...state.characters, [value.id]: value } }), "registered");
      return clone(value);
    };
    const mutate = (characterId, action, event, change) => {
      const value = character(characterId);
      if (!value) return reject("unknown-character", { characterId });
      const next = { ...change(clone(value)), revision: value.revision + 1 };
      commit({ ok: true, action, characterId: value.id }, (state) => ({ ...state, characters: { ...state.characters, [value.id]: next } }), event);
      return clone(next);
    };
    return {
      identity: Object.freeze({ register, get: (characterId) => clone(character(characterId)), list: () => Object.values(read().characters).map(clone) }),
      roles: Object.freeze({ set: (characterId, roles) => mutate(characterId, "set-roles", "status.changed", (value) => ({ ...value, roles: list(roles).map(String) })) }),
      capabilities: Object.freeze({
        grant: (characterId, capability) => mutate(characterId, "grant-capability", "capability.granted", (value) => ({ ...value, capabilities: Array.from(new Set([...value.capabilities, String(capability)])).sort() })),
        revoke: (characterId, capability) => mutate(characterId, "revoke-capability", "capability.revoked", (value) => ({ ...value, capabilities: value.capabilities.filter((entry) => entry !== String(capability)) })),
        has: (characterId, capability) => character(characterId)?.capabilities?.includes(String(capability)) ?? false
      }),
      conditions: Object.freeze({ set: (characterId, conditionId, value) => mutate(characterId, "set-condition", "condition.changed", (entry) => ({ ...entry, conditions: { ...entry.conditions, [String(conditionId)]: clone(value) } })), get: (characterId, conditionId) => clone(character(characterId)?.conditions?.[String(conditionId)]) }),
      control: Object.freeze({ assign: (characterId, controller) => mutate(characterId, "assign-controller", "controller.assigned", (value) => ({ ...value, controller: clone(controller) })), release: (characterId) => mutate(characterId, "release-controller", "controller.assigned", (value) => ({ ...value, controller: null })) }),
      references: Object.freeze({ set: (characterId, key, value) => mutate(characterId, "set-reference", "status.changed", (entry) => ({ ...entry, references: { ...entry.references, [String(key)]: clone(value) } })) }),
      status: Object.freeze({ set: (characterId, status) => mutate(characterId, "set-status", "status.changed", (value) => ({ ...value, status: String(status) })) }),
      getDescriptors: () => Object.values(read().characters).map((value) => ({ id: value.id, kind: "character", label: value.label, characterKind: value.kind, roles: [...value.roles], capabilities: [...value.capabilities], conditions: clone(value.conditions), controller: clone(value.controller), references: clone(value.references), status: value.status }))
    };
  });
}

export const KNOWLEDGE_INVESTIGATION_DOMAIN_PATH = "n:knowledge:investigation";
export function createKnowledgeInvestigationDomainKit(NexusEngine, config = {}) {
  const normalizeCase = (input = {}, index = 0) => ({
    id: id(input.id ?? `case-${index + 1}`, "Investigation case"),
    label: String(input.label ?? input.id ?? `Case ${index + 1}`),
    question: String(input.question ?? ""),
    status: String(input.status ?? "open"),
    subjects: list(input.subjects).map(clone),
    observations: list(input.observations).map(clone),
    evidence: list(input.evidence).map(clone),
    hypotheses: list(input.hypotheses).map(clone),
    conclusion: clone(input.conclusion ?? null),
    metadata: clone(input.metadata ?? {}),
    revision: 1
  });
  const cases = Object.fromEntries(list(config.cases).map((entry, index) => {
    const value = normalizeCase(entry, index);
    return [value.id, value];
  }));
  const initial = { schema: "nexusengine.knowledge.investigation/1", version: SEMANTIC_DOMAIN_KITS_VERSION, cases, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createKnowledgeInvestigationDomainKit", kitId: "knowledge-investigation-domain-kit",
    domain: "investigation", path: KNOWLEDGE_INVESTIGATION_DOMAIN_PATH, parent: "n:knowledge", api: "investigation", family: "knowledge",
    purpose: "Bounded knowledge authority for cases, observations, evidence, hypotheses, and conclusions.",
    services: ["cases", "subjects", "observations", "evidence", "hypotheses", "conclusions", "descriptors", "snapshot", "reset"],
    provides: ["knowledge:investigation", "investigation:evidence", "investigation:hypotheses"],
    events: ["case.opened", "observation.recorded", "evidence.added", "hypothesis.proposed", "conclusion.reached", "command.rejected", "reset"]
  }, config, initial, ({ read, commit, reject }) => {
    const investigationCase = (caseId) => read().cases[String(caseId)] ?? null;
    const open = (input) => {
      const value = normalizeCase(input);
      if (investigationCase(value.id)) return reject("case-already-exists", { caseId: value.id });
      commit({ ok: true, action: "open-case", caseId: value.id }, (state) => ({ ...state, cases: { ...state.cases, [value.id]: value } }), "case.opened");
      return clone(value);
    };
    const mutate = (caseId, action, event, change) => {
      const value = investigationCase(caseId);
      if (!value) return reject("unknown-case", { caseId });
      const next = { ...change(clone(value)), revision: value.revision + 1 };
      commit({ ok: true, action, caseId: value.id }, (state) => ({ ...state, cases: { ...state.cases, [value.id]: next } }), event);
      return clone(next);
    };
    return {
      cases: Object.freeze({ open, get: (caseId) => clone(investigationCase(caseId)), list: () => Object.values(read().cases).map(clone) }),
      subjects: Object.freeze({ add: (caseId, subject) => mutate(caseId, "add-subject", "observation.recorded", (value) => ({ ...value, subjects: [...value.subjects, clone(subject)] })) }),
      observations: Object.freeze({ record: (caseId, observation) => mutate(caseId, "record-observation", "observation.recorded", (value) => ({ ...value, observations: [...value.observations, clone(observation)] })) }),
      evidence: Object.freeze({ add: (caseId, evidence) => mutate(caseId, "add-evidence", "evidence.added", (value) => ({ ...value, evidence: [...value.evidence, clone(evidence)] })) }),
      hypotheses: Object.freeze({ propose: (caseId, hypothesis) => mutate(caseId, "propose-hypothesis", "hypothesis.proposed", (value) => ({ ...value, hypotheses: [...value.hypotheses, clone(hypothesis)] })) }),
      conclusions: Object.freeze({ reach: (caseId, conclusion) => mutate(caseId, "reach-conclusion", "conclusion.reached", (value) => ({ ...value, status: "concluded", conclusion: clone(conclusion) })) }),
      getDescriptors: () => Object.values(read().cases).map((value) => ({ id: value.id, kind: "investigation-case", label: value.label, question: value.question, status: value.status, subjectCount: value.subjects.length, observationCount: value.observations.length, evidenceCount: value.evidence.length, hypothesisCount: value.hypotheses.length, conclusion: clone(value.conclusion) }))
    };
  });
}

export const CONFLICT_DEFENSE_DOMAIN_PATH = "n:conflict:defense";
const DEFENSE_BOUNDARIES = ["map", "economyWallet", "buildPlacement", "waveAgentDirector", "combatResolver", "sessionFacade", "renderDescriptors"];
export function createConflictDefenseDomainKit(NexusEngine, config = {}) {
  const initial = { schema: "nexusengine.conflict.defense/1", version: SEMANTIC_DOMAIN_KITS_VERSION, observations: 0, lastSnapshot: null, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createConflictDefenseDomainKit", kitId: "conflict-defense-domain-kit",
    domain: "defense", path: CONFLICT_DEFENSE_DOMAIN_PATH, parent: "n:conflict", api: "defense", family: "conflict",
    purpose: "Semantic defense authority over the existing generic-defense DSK boundaries.",
    services: ["battlefield", "logistics", "fortification", "threats", "engagement", "session", "descriptors", "snapshot", "reset"],
    provides: ["conflict:defense", "defense:session-facade", "defense:read-model"],
    events: ["snapshot.observed", "command.rejected", "reset"],
    metadata: { composes: ["generic-defense-dsk-boundaries"], contentDefined: false }
  }, config, initial, ({ engine, read, write, reject, emit }) => {
    const root = () => engine.n?.genericDefense ?? {};
    const call = (service, method, args) => root()[service]?.[method]?.(...args) ?? reject("generic-defense-boundary-unavailable", { service: `${service}.${method}` });
    const observe = () => {
      const snapshot = root().sessionFacade?.getSnapshot?.() ?? {};
      const render = root().renderDescriptors?.getSnapshot?.() ?? snapshot.render ?? {};
      const semantic = { version: SEMANTIC_DOMAIN_KITS_VERSION, battlefield: snapshot.map ?? null, logistics: snapshot.economy ?? null, fortification: snapshot.structures ?? null, threats: snapshot.agents ?? null, engagement: snapshot.combat ?? null, session: snapshot.session ?? null, descriptors: clone(render.descriptors ?? []) };
      const state = read();
      write({ ...state, observations: state.observations + 1, lastSnapshot: clone(semantic), revision: state.revision + 1 });
      emit("snapshot.observed", { observations: state.observations + 1 });
      return clone(semantic);
    };
    return {
      battlefield: Object.freeze({ getState: () => root().map?.getState?.() ?? null, samplePath: (...args) => call("map", "samplePath", args), getSlot: (...args) => call("map", "getSlot", args) }),
      logistics: Object.freeze({ credit: (...args) => call("economyWallet", "credit", args), debit: (...args) => call("economyWallet", "debit", args), getState: () => root().economyWallet?.getState?.() ?? null }),
      fortification: Object.freeze({ build: (...args) => call("buildPlacement", "build", args), upgrade: (...args) => call("buildPlacement", "upgrade", args), getState: () => root().buildPlacement?.getState?.() ?? null }),
      threats: Object.freeze({ startWave: (...args) => call("waveAgentDirector", "startWave", args), getState: () => root().waveAgentDirector?.getState?.() ?? null }),
      engagement: Object.freeze({ getState: () => root().combatResolver?.getState?.() ?? null }),
      session: Object.freeze({ startWave: (...args) => call("sessionFacade", "startWave", args), build: (...args) => call("sessionFacade", "build", args), upgrade: (...args) => call("sessionFacade", "upgrade", args), select: (...args) => call("sessionFacade", "select", args), restart: (...args) => call("sessionFacade", "restart", args), getSnapshot: observe }),
      getSnapshot: observe,
      getDescriptors: () => observe().descriptors
    };
  });
}
export function createConflictDefenseDomainKits(NexusEngine, config = {}) {
  return [...createGenericDefenseDskBundle(NexusEngine, config.genericDefense ?? config, config.boundaryIds ?? DEFENSE_BOUNDARIES), createConflictDefenseDomainKit(NexusEngine, config.semantic ?? config)];
}

export const SEMANTIC_EXPERIENCE_COMPOSITION_DOMAIN_PATH = "n:composition:experience";
export function createSemanticExperienceCompositionKit(NexusEngine, config = {}) {
  const domains = list(config.domains).map((entry, index) => ({
    id: id(entry.id ?? entry.apiName ?? `domain-${index + 1}`, "Composition domain"),
    family: String(entry.family ?? "unclassified"),
    domainPath: String(entry.domainPath ?? `n:${entry.id}`),
    apiName: String(entry.apiName ?? entry.id),
    role: String(entry.role ?? "authority"),
    required: entry.required !== false,
    snapshotMethod: String(entry.snapshotMethod ?? "getSnapshot"),
    descriptorMethod: String(entry.descriptorMethod ?? "getDescriptors")
  }));
  const initial = { schema: "nexusengine.composition.experience/1", version: SEMANTIC_DOMAIN_KITS_VERSION, id: String(config.compositionId ?? "semantic-experience"), label: String(config.label ?? "Semantic Experience"), domains, bindings: list(config.bindings).map(clone), presets: clone(config.presets ?? {}), validation: null, lastReadModel: null, revision: 1, journal: [], lastResult: null };
  return createSemanticDsk(NexusEngine, {
    factory: "createSemanticExperienceCompositionKit", kitId: "semantic-experience-composition-kit",
    domain: "experience-composition", path: SEMANTIC_EXPERIENCE_COMPOSITION_DOMAIN_PATH, parent: "n:composition", api: "experienceComposition", family: "composition",
    purpose: "Composition root for bounded semantic domains, product bridges, presets, and consumer read models.",
    services: ["graph", "validation", "read-model", "bindings", "presets", "snapshot", "reset"],
    provides: ["composition:experience", "composition:domain-graph", "composition:read-model"],
    events: ["validated", "read-model.built", "command.rejected", "reset"],
    metadata: { ownsSimulation: false, contentDefined: false }
  }, config, initial, ({ engine, read, write, emit }) => {
    const resolve = (entry) => engine.n?.[entry.apiName] ?? null;
    const validate = () => {
      const state = read();
      const installed = state.domains.map((entry) => ({ ...entry, installed: Boolean(resolve(entry)) }));
      const missing = installed.filter((entry) => entry.required && !entry.installed).map((entry) => entry.id);
      const result = { valid: missing.length === 0, missing, domains: installed, bindingCount: state.bindings.length };
      write({ ...state, validation: result, revision: state.revision + 1 });
      emit("validated", result);
      return clone(result);
    };
    const build = () => {
      const state = read();
      const domainModels = {};
      for (const entry of state.domains) {
        const api = resolve(entry);
        domainModels[entry.id] = api ? { installed: true, family: entry.family, role: entry.role, domainPath: entry.domainPath, snapshot: clone(api[entry.snapshotMethod]?.() ?? api.getState?.() ?? null), descriptors: clone(api[entry.descriptorMethod]?.() ?? []) } : { installed: false, snapshot: null, descriptors: [] };
      }
      const model = { id: state.id, label: state.label, domains: domainModels, bindings: clone(state.bindings), presets: clone(state.presets) };
      write({ ...state, lastReadModel: model, revision: state.revision + 1 });
      emit("read-model.built", { domainCount: Object.keys(domainModels).length });
      return clone(model);
    };
    return {
      graph: Object.freeze({ get: () => clone(read().domains), paths: () => read().domains.map((entry) => entry.domainPath), families: () => Array.from(new Set(read().domains.map((entry) => entry.family))).sort() }),
      validation: Object.freeze({ run: validate, get: () => clone(read().validation) }),
      readModel: Object.freeze({ build, get: () => clone(read().lastReadModel) }),
      bindings: Object.freeze({ list: () => clone(read().bindings) }),
      presets: Object.freeze({ get: () => clone(read().presets) })
    };
  });
}

export function createSemanticBoundedDomainKits(NexusEngine, config = {}) {
  const domains = config.domains ?? {};
  const kits = [
    createMobilityTraversalDomainKit(NexusEngine, domains.traversal ?? {}),
    createInfrastructureRestorationDomainKit(NexusEngine, domains.restoration ?? {}),
    createWorldEnvironmentDomainKit(NexusEngine, domains.environment ?? {}),
    createAgencyCharacterDomainKit(NexusEngine, domains.character ?? {}),
    createKnowledgeInvestigationDomainKit(NexusEngine, domains.investigation ?? {})
  ];
  if (config.conflictDefense === true) kits.push(...createConflictDefenseDomainKits(NexusEngine, config.defense ?? {}));
  else if (config.conflictDefense === "facade") kits.push(createConflictDefenseDomainKit(NexusEngine, config.defense ?? {}));
  if (config.composition !== false) {
    kits.push(createSemanticExperienceCompositionKit(NexusEngine, {
      label: config.label ?? "Semantic Bounded Domain Composition",
      ...(config.composition ?? {}),
      domains: config.composition?.domains ?? [
        { id: "traversal", family: "mobility", domainPath: MOBILITY_TRAVERSAL_DOMAIN_PATH, apiName: "traversal" },
        { id: "restoration", family: "infrastructure", domainPath: INFRASTRUCTURE_RESTORATION_DOMAIN_PATH, apiName: "restoration" },
        { id: "environment", family: "world", domainPath: WORLD_ENVIRONMENT_DOMAIN_PATH, apiName: "environment" },
        { id: "character", family: "agency", domainPath: AGENCY_CHARACTER_DOMAIN_PATH, apiName: "character" },
        { id: "investigation", family: "knowledge", domainPath: KNOWLEDGE_INVESTIGATION_DOMAIN_PATH, apiName: "investigation" }
      ]
    }));
  }
  return kits;
}

export default createSemanticBoundedDomainKits;
