import { createGenericRouteProgressKit } from "../generic-route-progress-kit/index.js";
import { createGenericResourceLoopKit } from "../generic-resource-loop-kit/index.js";
import { createGenericPressureLoopKit } from "../generic-pressure-loop-kit/index.js";

export const GENERIC_ROUTE_CARGO_EXTRACTION_KIT_VERSION = "0.1.0";
export const GENERIC_ROUTE_CARGO_EXTRACTION_ENGINE_NAMESPACE = "genericRouteCargoExtraction";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") {
      throw new TypeError(`createGenericRouteCargoExtractionKit requires NexusRealtime.${key}.`);
    }
  }
}

function normalizeCargoResources(config = {}) {
  const resources = asArray(config.cargoResources ?? config.resources);
  if (resources.length > 0) return resources;
  return [{
    id: config.cargoId ?? "cargo",
    label: config.cargoLabel ?? "Cargo",
    min: 0,
    max: Math.max(1, toNumber(config.cargoCapacity, 3)),
    initial: Math.max(0, toNumber(config.initialCargo, 0)),
    thresholds: [{ id: "empty", value: 0, direction: "below" }, { id: "loaded", value: 1, direction: "above" }],
    tags: ["cargo", "extraction"]
  }];
}

function normalizePressureChannels(config = {}) {
  const channels = asArray(config.pressureChannels ?? config.channels);
  if (channels.length > 0) return channels;
  return [{
    id: config.pressureId ?? "extraction-pressure",
    label: config.pressureLabel ?? "Extraction Pressure",
    min: 0,
    max: 100,
    value: Math.max(0, toNumber(config.initialPressure, 0)),
    warningAt: Math.max(1, toNumber(config.warningAt, 65)),
    failAt: Math.max(1, toNumber(config.failAt, 100)),
    risePerSecond: Math.max(0, toNumber(config.pressureRisePerSecond, 0)),
    tags: ["pressure", "extraction"]
  }];
}

function descriptorFromCargo(resource) {
  return {
    id: resource.id,
    kind: "cargo-resource",
    label: resource.label,
    value: resource.value,
    min: resource.min,
    max: resource.max,
    empty: Boolean(resource.empty),
    full: Boolean(resource.full),
    locked: Boolean(resource.locked),
    tags: [...(resource.tags ?? [])]
  };
}

function descriptorFromPressure(channel) {
  return {
    id: channel.id,
    kind: "extraction-pressure-channel",
    label: channel.label,
    value: channel.value,
    min: channel.min,
    max: channel.max,
    warningAt: channel.warningAt,
    failAt: channel.failAt,
    status: channel.status,
    tags: [...(channel.tags ?? [])]
  };
}

function createDescriptors(route, cargo, pressure) {
  return [
    ...asArray(route?.descriptors).map((descriptor) => ({ ...clone(descriptor), higherDomain: "route-cargo-extraction" })),
    ...asArray(cargo?.resources).map(descriptorFromCargo),
    ...asArray(pressure?.channels).map(descriptorFromPressure)
  ];
}

function classifyStatus(route, pressure) {
  if (pressure?.status === "failed") return "failed";
  if (route?.status === "completed") return "completed";
  if (route?.status === "empty") return "empty";
  return "active";
}

function createSnapshot(config, engine, world) {
  const route = engine.genericRouteProgress?.getState?.() ?? null;
  const cargo = engine.genericResourceLoop?.getState?.() ?? null;
  const pressure = engine.genericPressureLoop?.getState?.() ?? null;
  return {
    version: GENERIC_ROUTE_CARGO_EXTRACTION_KIT_VERSION,
    id: String(config.stateId ?? config.id ?? config.routeId ?? "generic-route-cargo-extraction"),
    label: String(config.label ?? "Generic Route Cargo Extraction"),
    status: classifyStatus(route, pressure),
    route: clone(route),
    cargo: clone(cargo),
    pressure: clone(pressure),
    descriptors: createDescriptors(route, cargo, pressure),
    updatedAtTick: toNumber(world?.__nexusClock?.frame, 0)
  };
}

function ensureNamespace(engine) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[GENERIC_ROUTE_CARGO_EXTRACTION_ENGINE_NAMESPACE] || typeof engine.n[GENERIC_ROUTE_CARGO_EXTRACTION_ENGINE_NAMESPACE] !== "object") {
    engine.n[GENERIC_ROUTE_CARGO_EXTRACTION_ENGINE_NAMESPACE] = {};
  }
  return engine.n[GENERIC_ROUTE_CARGO_EXTRACTION_ENGINE_NAMESPACE];
}

function routeConfigFor(config = {}) {
  return {
    ...config.routeProgress,
    kitId: config.routeProgress?.kitId ?? "generic-route-cargo-extraction-route-progress-kit",
    resourceName: config.routeProgress?.resourceName ?? "genericRouteCargoExtraction.routeProgress.state",
    routeId: config.routeId ?? config.route?.id ?? config.id ?? "generic-route-cargo-extraction",
    label: config.routeLabel ?? config.route?.label ?? config.label ?? "Generic Route Cargo Extraction",
    checkpoints: config.checkpoints ?? config.route?.checkpoints ?? config.routeProgress?.checkpoints ?? []
  };
}

function resourceConfigFor(config = {}) {
  return {
    ...config.resourceLoop,
    kitId: config.resourceLoop?.kitId ?? "generic-route-cargo-extraction-resource-loop-kit",
    resourceName: config.resourceLoop?.resourceName ?? "genericRouteCargoExtraction.cargo.state",
    resources: normalizeCargoResources(config)
  };
}

function pressureConfigFor(config = {}) {
  return {
    ...config.pressureLoop,
    kitId: config.pressureLoop?.kitId ?? "generic-route-cargo-extraction-pressure-loop-kit",
    resourceName: config.pressureLoop?.resourceName ?? "genericRouteCargoExtraction.pressure.state",
    channels: normalizePressureChannels(config)
  };
}

export function createGenericRouteCargoExtractionKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;

  const RouteCargoExtractionState = defineResource(config.resourceName ?? "genericRouteCargoExtraction.state");
  const SnapshotUpdated = defineEvent("genericRouteCargoExtraction.snapshot.updated");
  const CargoChanged = defineEvent("genericRouteCargoExtraction.cargo.changed");
  const PressureChanged = defineEvent("genericRouteCargoExtraction.pressure.changed");
  const Completed = defineEvent("genericRouteCargoExtraction.completed");
  const Rejected = defineEvent("genericRouteCargoExtraction.rejected");

  const childKits = [
    createGenericRouteProgressKit(NexusRealtime, routeConfigFor(config)),
    createGenericResourceLoopKit(NexusRealtime, resourceConfigFor(config)),
    createGenericPressureLoopKit(NexusRealtime, pressureConfigFor(config))
  ];

  function refresh(world, engine, reason = "refresh", emitEvent = false) {
    const snapshot = createSnapshot(config, engine, world);
    world.setResource(RouteCargoExtractionState, snapshot);
    if (emitEvent) world.emit(SnapshotUpdated, { reason, status: snapshot.status, descriptorCount: snapshot.descriptors.length });
    return clone(snapshot);
  }

  function reject(world, reason, payload = {}) {
    const event = { reason, ...payload };
    world.emit(Rejected, event);
    return { accepted: false, reason, event };
  }

  function system(world) {
    const engine = world.__genericRouteCargoExtractionEngine;
    if (engine) refresh(world, engine, "tick");
  }

  return defineRuntimeKit({
    id: config.kitId ?? config.id ?? "generic-route-cargo-extraction-kit",
    provides: ["route-cargo:extraction", "route:progress", "cargo:resource-ledger", "pressure:extraction"],
    requires: ["generic-route-progress-kit", "generic-resource-loop-kit", "generic-pressure-loop-kit"],
    resources: { RouteCargoExtractionState },
    events: { SnapshotUpdated, CargoChanged, PressureChanged, Completed, Rejected },
    systems: [
      ...childKits.flatMap((kit) => kit.systems ?? []),
      { phase: config.phase ?? "resolve", name: "genericRouteCargoExtractionSystem", system }
    ],
    initWorld({ world, engine }) {
      for (const kit of childKits) kit.initWorld?.({ world, engine });
      world.setResource(RouteCargoExtractionState, {
        version: GENERIC_ROUTE_CARGO_EXTRACTION_KIT_VERSION,
        id: String(config.stateId ?? config.id ?? config.routeId ?? "generic-route-cargo-extraction"),
        label: String(config.label ?? "Generic Route Cargo Extraction"),
        status: "initializing",
        route: null,
        cargo: null,
        pressure: null,
        descriptors: [],
        updatedAtTick: toNumber(world?.__nexusClock?.frame, 0)
      });
    },
    install({ engine, world }) {
      for (const kit of childKits) kit.install?.({ engine, world });
      world.__genericRouteCargoExtractionEngine = engine;

      const namespace = ensureNamespace(engine);
      const facade = {
        resources: { RouteCargoExtractionState },
        events: { SnapshotUpdated, CargoChanged, PressureChanged, Completed, Rejected },
        enterCheckpoint(checkpointId, payload = {}) {
          const result = engine.genericRouteProgress?.enter?.(checkpointId, payload);
          if (!result) return reject(world, "route-progress-unavailable", { checkpointId, commandId: payload.commandId });
          return { ...result, snapshot: refresh(world, engine, "enter-checkpoint", true) };
        },
        completeCheckpoint(checkpointId, payload = {}) {
          const result = engine.genericRouteProgress?.complete?.(checkpointId, payload);
          if (!result) return reject(world, "route-progress-unavailable", { checkpointId, commandId: payload.commandId });
          const snapshot = refresh(world, engine, "complete-checkpoint", true);
          if (result.completed) world.emit(Completed, { routeId: snapshot.route?.id, completedIds: snapshot.route?.completedIds ?? [], commandId: payload.commandId });
          return { ...result, snapshot };
        },
        advance(payload = {}) {
          return this.completeCheckpoint(engine.genericRouteProgress?.getState?.()?.activeId, payload);
        },
        pickupCargo(resourceId = config.cargoId ?? "cargo", amount = 1, payload = {}) {
          const cargo = engine.genericResourceLoop?.restore?.(resourceId, amount, payload.reason ?? "pickup-cargo");
          if (!cargo) return reject(world, "cargo-resource-unavailable", { resourceId, commandId: payload.commandId });
          world.emit(CargoChanged, { resourceId, amount: Math.abs(toNumber(amount, 0)), mode: "pickup", commandId: payload.commandId });
          return { accepted: true, cargo, snapshot: refresh(world, engine, "pickup-cargo", true) };
        },
        deliverCargo(resourceId = config.cargoId ?? "cargo", amount = 1, payload = {}) {
          const cargo = engine.genericResourceLoop?.spend?.(resourceId, amount, payload.reason ?? "deliver-cargo");
          if (!cargo) return reject(world, "cargo-resource-unavailable", { resourceId, commandId: payload.commandId });
          world.emit(CargoChanged, { resourceId, amount: -Math.abs(toNumber(amount, 0)), mode: "deliver", commandId: payload.commandId });
          return { accepted: true, cargo, snapshot: refresh(world, engine, "deliver-cargo", true) };
        },
        adjustPressure(channelId = config.pressureId ?? "extraction-pressure", amount = 0, payload = {}) {
          const pressure = engine.genericPressureLoop?.adjust?.(channelId, amount, payload.reason ?? "extraction-pressure");
          if (!pressure) return reject(world, "pressure-channel-unavailable", { channelId, commandId: payload.commandId });
          world.emit(PressureChanged, { channelId, amount: toNumber(amount, 0), mode: "adjust", commandId: payload.commandId });
          return { accepted: true, pressure, snapshot: refresh(world, engine, "adjust-pressure", true) };
        },
        recoverPressure(channelId = config.pressureId ?? "extraction-pressure", amount = 0, payload = {}) {
          const pressure = engine.genericPressureLoop?.recover?.(channelId, amount, payload.reason ?? "recover-pressure");
          if (!pressure) return reject(world, "pressure-channel-unavailable", { channelId, commandId: payload.commandId });
          world.emit(PressureChanged, { channelId, amount: -Math.abs(toNumber(amount, 0)), mode: "recover", commandId: payload.commandId });
          return { accepted: true, pressure, snapshot: refresh(world, engine, "recover-pressure", true) };
        },
        reset(payload = {}) {
          engine.genericRouteProgress?.reset?.({ route: payload.route ?? config.route, reason: payload.reason ?? "composite-reset" });
          engine.genericResourceLoop?.reset?.({ resources: payload.resources ?? normalizeCargoResources(config), reason: payload.reason ?? "composite-reset" });
          engine.genericPressureLoop?.reset?.({ channels: payload.pressureChannels ?? normalizePressureChannels(config), reason: payload.reason ?? "composite-reset" });
          return refresh(world, engine, "reset", true);
        },
        getSnapshot() {
          return refresh(world, engine, "snapshot");
        },
        getDescriptors() {
          return this.getSnapshot().descriptors;
        }
      };

      engine.genericRouteCargoExtraction = facade;
      if (namespace) Object.assign(namespace, facade);
      refresh(world, engine, "install", true);
    },
    metadata: {
      version: GENERIC_ROUTE_CARGO_EXTRACTION_KIT_VERSION,
      domain: "route-cargo-extraction",
      extendsBase: "DomainServiceKit",
      ownsLoop: false,
      composes: ["generic-route-progress-kit", "generic-resource-loop-kit", "generic-pressure-loop-kit"],
      purpose: "Composite route/cargo/extraction coordination over atomic route progress, resource ledger, and pressure loop DSKs.",
      boundary: "Coordinates existing route, cargo/resource, and pressure boundaries through a composite session facade, snapshot, and descriptors. It does not own renderer, browser input, hit testing, camera, physics, cargo fiction, hazard simulation, DOM, Canvas, WebGL, audio, or asset loading.",
      apiSurface: {
        resources: ["genericRouteCargoExtraction.state", "genericRouteCargoExtraction.routeProgress.state", "genericRouteCargoExtraction.cargo.state", "genericRouteCargoExtraction.pressure.state"],
        events: ["genericRouteCargoExtraction.snapshot.updated", "genericRouteCargoExtraction.cargo.changed", "genericRouteCargoExtraction.pressure.changed", "genericRouteCargoExtraction.completed", "genericRouteCargoExtraction.rejected"],
        methods: ["engine.genericRouteCargoExtraction.enterCheckpoint", "engine.genericRouteCargoExtraction.completeCheckpoint", "engine.genericRouteCargoExtraction.advance", "engine.genericRouteCargoExtraction.pickupCargo", "engine.genericRouteCargoExtraction.deliverCargo", "engine.genericRouteCargoExtraction.adjustPressure", "engine.genericRouteCargoExtraction.recoverPressure", "engine.genericRouteCargoExtraction.reset", "engine.genericRouteCargoExtraction.getSnapshot", "engine.genericRouteCargoExtraction.getDescriptors", "engine.n.genericRouteCargoExtraction.getSnapshot"],
        snapshots: ["route", "cargo", "pressure", "status", "descriptors"],
        descriptors: ["route-checkpoint", "cargo-resource", "extraction-pressure-channel"]
      }
    }
  });
}

export default createGenericRouteCargoExtractionKit;
