export const GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION = "0.2.0";
export const GENERIC_ANCHOR_DESCRIPTOR_ENGINE_NAMESPACE = "anchorDescriptors";

const DEFAULT_GROUP_ID = "default-route";
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

function requireNexus(NexusEngine) {
  for (const key of ["defineDomainServiceKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createGenericAnchorDescriptorKit requires NexusEngine.${key}.`);
    }
  }
}

export function normalizeAnchorDescriptor(anchor = {}, index = 0, defaults = {}) {
  const position = anchor.position ?? anchor.transform ?? anchor;
  const normal = anchor.normal ?? defaults.normal ?? { x: 0, y: 0, z: 1 };
  const id = String(anchor.id ?? `${defaults.idPrefix ?? "anchor"}-${index}`).trim();
  if (!id) throw new TypeError("Anchor descriptors require a stable id.");

  return {
    id,
    index: Number.isFinite(Number(anchor.index)) ? Number(anchor.index) : index,
    groupId: String(anchor.groupId ?? defaults.groupId ?? DEFAULT_GROUP_ID),
    position: {
      x: toNumber(position.x),
      y: toNumber(position.y),
      z: toNumber(position.z)
    },
    normal: {
      x: toNumber(normal.x),
      y: toNumber(normal.y),
      z: toNumber(normal.z, 1)
    },
    radius: Math.max(0, toNumber(anchor.radius ?? anchor.r, defaults.radius ?? 6)),
    tags: Array.from(new Set(asArray(anchor.tags).map(String).filter(Boolean))),
    metadata: clone(anchor.metadata ?? {}),
    source: anchor.source ?? defaults.source ?? "configured"
  };
}

function byId(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

function groupAnchors(anchors) {
  const groups = {};
  for (const anchor of anchors) {
    const group = groups[anchor.groupId] ?? { id: anchor.groupId, anchorIds: [] };
    group.anchorIds.push(anchor.id);
    groups[anchor.groupId] = group;
  }
  return groups;
}

function createState(config = {}) {
  const anchors = asArray(config.anchors).map((anchor, index) => normalizeAnchorDescriptor(anchor, index, config.defaults ?? {}));
  return {
    version: GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION,
    id: String(config.stateId ?? "generic-anchor-descriptors"),
    status: "ready",
    anchors,
    anchorsById: byId(anchors),
    groups: groupAnchors(anchors),
    updatedAtTick: 0,
    lastReason: "initialized"
  };
}

function restoreState(snapshot, config = {}) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    throw new TypeError("Anchor descriptor snapshots must be objects.");
  }
  if (snapshot.version !== GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION) {
    throw new TypeError(`Unsupported anchor descriptor snapshot version: ${snapshot.version}.`);
  }
  if (snapshot.status !== "ready") {
    throw new TypeError(`Invalid anchor descriptor snapshot status: ${snapshot.status}.`);
  }
  const anchors = asArray(snapshot.anchors).map((anchor, index) => normalizeAnchorDescriptor(anchor, index, config.defaults ?? {}));
  return {
    ...createState({ ...config, stateId: snapshot.id ?? config.stateId, anchors: [] }),
    status: "ready",
    anchors,
    anchorsById: byId(anchors),
    groups: groupAnchors(anchors),
    updatedAtTick: Math.max(0, Math.floor(toNumber(snapshot.updatedAtTick, 0))),
    lastReason: String(snapshot.lastReason ?? "snapshot-loaded")
  };
}

function replaceAnchors(state, anchors, reason = "set") {
  const normalized = asArray(anchors).map((anchor, index) => normalizeAnchorDescriptor(anchor, index));
  return {
    ...state,
    status: "ready",
    anchors: normalized,
    anchorsById: byId(normalized),
    groups: groupAnchors(normalized),
    lastReason: reason
  };
}

function upsertAnchors(state, anchors, reason = "upsert") {
  const existing = new Map(state.anchors.map((anchor) => [anchor.id, anchor]));
  for (const [index, anchor] of asArray(anchors).entries()) {
    const normalized = normalizeAnchorDescriptor(anchor, index);
    existing.set(normalized.id, { ...(existing.get(normalized.id) ?? {}), ...normalized });
  }
  const next = Array.from(existing.values()).sort((a, b) => a.index - b.index || a.id.localeCompare(b.id));
  return {
    ...state,
    anchors: next,
    anchorsById: byId(next),
    groups: groupAnchors(next),
    lastReason: reason
  };
}

function removeAnchors(state, ids, reason = "remove") {
  const blocked = new Set(asArray(ids).map(String));
  const anchors = state.anchors.filter((anchor) => !blocked.has(anchor.id));
  return {
    ...state,
    anchors,
    anchorsById: byId(anchors),
    groups: groupAnchors(anchors),
    lastReason: reason
  };
}

export function createGenericAnchorDescriptorKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineDomainServiceKit, defineResource, defineEvent } = NexusEngine;

  const AnchorDescriptorState = defineResource(config.resourceName ?? "genericAnchorDescriptor.state");
  const SetAnchors = defineEvent("genericAnchorDescriptor.setAnchors");
  const UpsertAnchors = defineEvent("genericAnchorDescriptor.upsertAnchors");
  const RemoveAnchors = defineEvent("genericAnchorDescriptor.removeAnchors");
  const ClearAnchors = defineEvent("genericAnchorDescriptor.clearAnchors");
  const AnchorsUpdated = defineEvent("genericAnchorDescriptor.updated");
  const AnchorsReset = defineEvent("genericAnchorDescriptor.reset");
  const SnapshotLoaded = defineEvent("genericAnchorDescriptor.snapshotLoaded");

  function currentState(world) {
    return world.getResource(AnchorDescriptorState) ?? createState(config);
  }

  function setState(world, state) {
    const next = { ...state, updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) };
    world.setResource(AnchorDescriptorState, next);
    return next;
  }

  function system(world) {
    let state = currentState(world);
    const initialReason = state.lastReason;
    let changed = false;

    for (const event of world.readEvents(SetAnchors)) {
      state = replaceAnchors(state, event.anchors ?? [], event.reason ?? "set");
      changed = true;
    }
    for (const event of world.readEvents(UpsertAnchors)) {
      state = upsertAnchors(state, event.anchors ?? event.anchor ?? [], event.reason ?? "upsert");
      changed = true;
    }
    for (const event of world.readEvents(RemoveAnchors)) {
      state = removeAnchors(state, event.ids ?? event.id ?? [], event.reason ?? "remove");
      changed = true;
    }
    for (const event of world.readEvents(ClearAnchors)) {
      state = replaceAnchors(state, [], event.reason ?? "clear");
      changed = true;
    }

    state = setState(world, state);
    if (changed || state.lastReason !== initialReason) {
      world.emit(AnchorsUpdated, { count: state.anchors.length, reason: state.lastReason });
    }
  }

  function reset(world, payload = {}) {
    const next = setState(world, {
      ...createState({ ...config, stateId: payload.stateId ?? config.stateId }),
      lastReason: payload.reason ?? "reset"
    });
    world.emit(AnchorsReset, { count: next.anchors.length, reason: next.lastReason });
    return clone(next);
  }

  function loadSnapshot(world, snapshot) {
    const next = restoreState(snapshot, config);
    world.setResource(AnchorDescriptorState, next);
    world.emit(SnapshotLoaded, { count: next.anchors.length, stateId: next.id });
    return clone(next);
  }

  function createApi(world) {
    return {
      resources: { AnchorDescriptorState },
      events: { SetAnchors, UpsertAnchors, RemoveAnchors, ClearAnchors, AnchorsUpdated, AnchorsReset, SnapshotLoaded },
      setAnchors(anchors = [], payload = {}) {
        world.emit(SetAnchors, { anchors, ...payload });
        return currentState(world);
      },
      upsertAnchors(anchors = [], payload = {}) {
        world.emit(UpsertAnchors, { anchors, ...payload });
        return currentState(world);
      },
      addAnchor(anchor, payload = {}) {
        world.emit(UpsertAnchors, { anchors: [anchor], ...payload });
        return currentState(world);
      },
      removeAnchors(ids = [], payload = {}) {
        world.emit(RemoveAnchors, { ids, ...payload });
        return currentState(world);
      },
      clear(payload = {}) {
        world.emit(ClearAnchors, payload);
        return currentState(world);
      },
      reset: (payload) => reset(world, payload),
      loadSnapshot: (snapshot) => loadSnapshot(world, snapshot),
      getState: () => currentState(world),
      getSnapshot: () => clone(currentState(world)),
      getAnchors(groupId = null) {
        const state = currentState(world);
        if (!groupId) return state.anchors;
        const ids = state.groups?.[groupId]?.anchorIds ?? [];
        return ids.map((id) => state.anchorsById[id]).filter(Boolean);
      },
      getAnchor: (id) => currentState(world).anchorsById?.[id] ?? null
    };
  }

  return defineDomainServiceKit({
    id: config.kitId ?? config.id ?? "generic-anchor-descriptor-kit",
    domain: "anchor-descriptor",
    domainPath: "n:spatial-placement:anchor-descriptor",
    parentDomainPath: "n:spatial-placement",
    apiName: GENERIC_ANCHOR_DESCRIPTOR_ENGINE_NAMESPACE,
    stability: "experimental",
    version: GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION,
    services: ["registry", "snapshot"],
    provides: ["anchor:descriptors", "route:anchors", "render:anchor-descriptors"],
    resources: { AnchorDescriptorState },
    events: { SetAnchors, UpsertAnchors, RemoveAnchors, ClearAnchors, AnchorsUpdated, AnchorsReset, SnapshotLoaded },
    systems: [{ phase: config.phase ?? "simulate", name: "genericAnchorDescriptorSystem", system }],
    initWorld({ world }) { world.setResource(AnchorDescriptorState, createState(config)); },
    createApi({ world }) { return createApi(world); },
    install({ engine }) {
      engine.anchorDescriptors = engine.n.anchorDescriptors;
    },
    bindings: { AnchorDescriptorState },
    metadata: {
      version: GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION,
      status: "experimental",
      parentDomain: "spatial-placement",
      scope: "atomic-domain",
      composes: [],
      ownsLoop: true,
      purpose: "Renderer-independent generic world-space anchor descriptors for routes, interactables, markers, and placement systems."
    }
  });
}

export default createGenericAnchorDescriptorKit;
