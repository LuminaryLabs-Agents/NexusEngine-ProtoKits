export const GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION = "0.1.0";

const DEFAULT_GROUP_ID = "default-route";
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createGenericAnchorDescriptorKit requires NexusRealtime.${key}.`);
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
    id: config.stateId ?? "generic-anchor-descriptors",
    status: "ready",
    anchors,
    anchorsById: byId(anchors),
    groups: groupAnchors(anchors),
    updatedAtTick: 0,
    lastReason: "initialized"
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

export function createGenericAnchorDescriptorKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const AnchorDescriptorState = defineResource(config.resourceName ?? "genericAnchorDescriptor.state");
  const SetAnchors = defineEvent("genericAnchorDescriptor.setAnchors");
  const UpsertAnchors = defineEvent("genericAnchorDescriptor.upsertAnchors");
  const RemoveAnchors = defineEvent("genericAnchorDescriptor.removeAnchors");
  const ClearAnchors = defineEvent("genericAnchorDescriptor.clearAnchors");
  const AnchorsUpdated = defineEvent("genericAnchorDescriptor.updated");

  function system(world) {
    let state = world.getResource(AnchorDescriptorState) ?? createState(config);
    const beforeCount = state.anchors.length;

    for (const event of world.readEvents(SetAnchors)) {
      state = replaceAnchors(state, event.anchors ?? [], event.reason ?? "set");
    }
    for (const event of world.readEvents(UpsertAnchors)) {
      state = upsertAnchors(state, event.anchors ?? event.anchor ?? [], event.reason ?? "upsert");
    }
    for (const event of world.readEvents(RemoveAnchors)) {
      state = removeAnchors(state, event.ids ?? event.id ?? [], event.reason ?? "remove");
    }
    for (const event of world.readEvents(ClearAnchors)) {
      state = replaceAnchors(state, [], event.reason ?? "clear");
    }

    state = { ...state, updatedAtTick: toNumber(world.__nexusClock?.frame, state.updatedAtTick) };
    world.setResource(AnchorDescriptorState, state);
    if (state.anchors.length !== beforeCount || state.lastReason !== "initialized") {
      world.emit(AnchorsUpdated, { count: state.anchors.length, reason: state.lastReason });
    }
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-anchor-descriptor-kit",
    provides: ["anchor:descriptors", "route:anchors", "render:anchor-descriptors"],
    resources: { AnchorDescriptorState },
    events: { SetAnchors, UpsertAnchors, RemoveAnchors, ClearAnchors, AnchorsUpdated },
    systems: [{ phase: config.phase ?? "simulate", name: "genericAnchorDescriptorSystem", system }],
    initWorld({ world }) {
      world.setResource(AnchorDescriptorState, createState(config));
    },
    install({ engine, world }) {
      engine.anchorDescriptors = {
        resources: { AnchorDescriptorState },
        events: { SetAnchors, UpsertAnchors, RemoveAnchors, ClearAnchors, AnchorsUpdated },
        setAnchors(anchors = [], payload = {}) {
          world.emit(SetAnchors, { anchors, ...payload });
          return world.getResource(AnchorDescriptorState);
        },
        upsertAnchors(anchors = [], payload = {}) {
          world.emit(UpsertAnchors, { anchors, ...payload });
          return world.getResource(AnchorDescriptorState);
        },
        addAnchor(anchor, payload = {}) {
          world.emit(UpsertAnchors, { anchors: [anchor], ...payload });
          return world.getResource(AnchorDescriptorState);
        },
        removeAnchors(ids = [], payload = {}) {
          world.emit(RemoveAnchors, { ids, ...payload });
          return world.getResource(AnchorDescriptorState);
        },
        clear(payload = {}) {
          world.emit(ClearAnchors, payload);
          return world.getResource(AnchorDescriptorState);
        },
        getState() {
          return world.getResource(AnchorDescriptorState);
        },
        getAnchors(groupId = null) {
          const state = world.getResource(AnchorDescriptorState);
          if (!groupId) return state?.anchors ?? [];
          const ids = state?.groups?.[groupId]?.anchorIds ?? [];
          return ids.map((id) => state.anchorsById[id]).filter(Boolean);
        },
        getAnchor(id) {
          return world.getResource(AnchorDescriptorState)?.anchorsById?.[id] ?? null;
        }
      };
    },
    bindings: { AnchorDescriptorState },
    metadata: {
      version: GENERIC_ANCHOR_DESCRIPTOR_KIT_VERSION,
      status: "experimental",
      purpose: "Renderer-independent generic world-space anchor descriptors for routes, interactables, markers, and placement systems."
    }
  });
}

export default createGenericAnchorDescriptorKit;
