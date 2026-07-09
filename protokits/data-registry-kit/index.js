import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, hashString, scopedSeed } from "../protokit-core/index.js";

export const DATA_REGISTRY_KIT_VERSION = "0.2.0";

function canonicalize(value) {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
}

export function stableDescriptorHash(value) {
  return hashString(JSON.stringify(canonicalize(value))).toString(36);
}

export function createObjectProofRegistry(options = {}) {
  const proof = options.objectProof ?? options.proofs ?? {};
  return {
    specs: { ...(proof.specs ?? options.objectSpecs ?? {}) },
    seedScopes: { ...(proof.seedScopes ?? options.seedScopes ?? {}) },
    schemaVersions: { ...(proof.schemaVersions ?? options.schemaVersions ?? {}) },
    outputHashes: { ...(proof.outputHashes ?? options.outputHashes ?? {}) },
    packetRefs: { ...(proof.packetRefs ?? options.packetRefs ?? {}) }
  };
}

export function createGameDataState(options = {}) {
  const data = clone(options.data ?? options.gameData ?? {});
  return {
    version: DATA_REGISTRY_KIT_VERSION,
    seed: options.seed ?? data.seed ?? "game-seed",
    mode: options.mode ?? data.mode ?? "hybrid",
    namespaces: { ...(data.namespaces ?? {}), ...(options.namespaces ?? {}) },
    static: clone(data.static ?? options.static ?? {}),
    generated: clone(data.generated ?? options.generated ?? {}),
    overrides: clone(data.overrides ?? options.overrides ?? {}),
    quality: clone(data.quality ?? options.quality ?? {}),
    controls: clone(data.controls ?? options.controls ?? {}),
    objectProof: createObjectProofRegistry({ ...data, ...options }),
    raw: data
  };
}

export function readPath(object = {}, path = "") {
  if (!path) return object;
  return String(path).split(".").filter(Boolean).reduce((value, key) => value?.[key], object);
}

export function writePath(object = {}, path = "", value) {
  const keys = String(path).split(".").filter(Boolean);
  if (!keys.length) return value;
  let cursor = object;
  for (const key of keys.slice(0, -1)) cursor = cursor[key] ??= {};
  cursor[keys[keys.length - 1]] = value;
  return object;
}

export function resolveContentMode(state = {}, request = {}) {
  const mode = request.mode ?? state.mode ?? "hybrid";
  const key = request.key ?? request.id ?? request.path;
  const override = key ? readPath(state.overrides, key) : undefined;
  const staticValue = key ? readPath(state.static, key) : undefined;
  const generatedValue = key ? readPath(state.generated, key) : undefined;
  if (override !== undefined) return { mode, source: "override", value: clone(override) };
  if (mode === "static") return { mode, source: "static", value: clone(staticValue) };
  if (mode === "seeded") return { mode, source: "generated", value: clone(generatedValue) };
  return { mode, source: staticValue !== undefined ? "static" : "generated", value: clone(staticValue ?? generatedValue) };
}

function normalizeObjectSpec(spec = {}, context = {}) {
  const id = spec.id ?? spec.objectId ?? context.id;
  const packetRef = spec.packetRef ?? spec.packet ?? context.packetRef ?? null;
  return {
    id,
    kind: spec.kind ?? spec.archetype ?? "object-proof",
    schemaVersion: spec.schemaVersion ?? context.schemaVersion ?? "object-proof-spec.v1",
    seedScope: spec.seedScope ?? context.seedScope ?? scopedSeed(context.seed ?? "object-proof", packetRef, id),
    packetRef,
    variant: spec.variant ?? "default",
    descriptor: clone(spec.descriptor ?? spec.object ?? {}),
    budget: clone(spec.budget ?? {}),
    metadata: clone(spec.metadata ?? {}),
    ...clone(spec),
    id,
    packetRef
  };
}

export function createDataRegistryKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const GameDataState = resource(options.resourceName ?? "gameData.state");
  const GameDataUpdated = event("gameData.updated");
  const GameDataNamespaceRegistered = event("gameData.namespaceRegistered");
  const ObjectProofSpecRegistered = event("gameData.objectProofSpecRegistered");
  const ObjectProofHashRecorded = event("gameData.objectProofHashRecorded");
  const ObjectProofSchemaRegistered = event("gameData.objectProofSchemaRegistered");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "data-registry-kit",
    resources: { GameDataState },
    events: { GameDataUpdated, GameDataNamespaceRegistered, ObjectProofSpecRegistered, ObjectProofHashRecorded, ObjectProofSchemaRegistered },
    provides: ["data-registry", "game-data", "object-proof-specs", "seed-scope-descriptors", "schema-version-descriptors"],
    initWorld({ world }) { ensureResource(world, GameDataState, () => createGameDataState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, GameDataState, () => createGameDataState(options));
      const publish = (next) => { world.setResource(GameDataState, next); return next; };
      engine.gameData = {
        getState: state,
        get seed() { return state().seed; },
        scopedSeed: (...parts) => scopedSeed(state().seed, ...parts),
        get(path, fallback = undefined) {
          const value = readPath(state().raw, path) ?? readPath(state(), path);
          return value === undefined ? fallback : clone(value);
        },
        set(path, value) {
          const next = state();
          writePath(next.raw, path, clone(value));
          publish(next);
          world.emit(GameDataUpdated, { path, value: clone(value) });
          return value;
        },
        registerNamespace(name, value = {}) {
          const next = state();
          next.namespaces[name] = clone(value);
          next.raw[name] = next.raw[name] ?? clone(value);
          publish(next);
          world.emit(GameDataNamespaceRegistered, { name, value: clone(value) });
          return next.namespaces[name];
        },
        registerObjectSpec(spec = {}) {
          const next = state();
          const normalized = normalizeObjectSpec(spec, { seed: next.seed });
          if (!normalized.id) throw new TypeError("registerObjectSpec requires spec.id");
          next.objectProof ??= createObjectProofRegistry();
          next.objectProof.specs[normalized.id] = normalized;
          if (normalized.packetRef) next.objectProof.packetRefs[normalized.id] = normalized.packetRef;
          next.objectProof.seedScopes[normalized.id] = normalized.seedScope;
          next.objectProof.schemaVersions[normalized.id] = normalized.schemaVersion;
          publish(next);
          world.emit(ObjectProofSpecRegistered, { spec: clone(normalized) });
          return clone(normalized);
        },
        getObjectSpec(id, fallback = null) {
          return clone(state().objectProof?.specs?.[id] ?? fallback);
        },
        listObjectSpecs() {
          return Object.values(state().objectProof?.specs ?? {}).map(clone);
        },
        registerSeedScope(id, seedScope) {
          const next = state();
          next.objectProof ??= createObjectProofRegistry();
          next.objectProof.seedScopes[id] = seedScope ?? scopedSeed(next.seed, "object-proof", id);
          publish(next);
          return next.objectProof.seedScopes[id];
        },
        scopedObjectSeed(id, ...parts) {
          const base = state().objectProof?.seedScopes?.[id] ?? scopedSeed(state().seed, "object-proof", id);
          return scopedSeed(base, ...parts);
        },
        registerSchemaVersion(name, version = "v1") {
          const next = state();
          next.objectProof ??= createObjectProofRegistry();
          next.objectProof.schemaVersions[name] = version;
          publish(next);
          world.emit(ObjectProofSchemaRegistered, { name, version });
          return version;
        },
        recordOutputHash(id, descriptor, payload = {}) {
          const next = state();
          next.objectProof ??= createObjectProofRegistry();
          const hash = payload.hash ?? stableDescriptorHash(descriptor);
          next.objectProof.outputHashes[id] = { id, hash, descriptorShape: payload.descriptorShape ?? Object.keys(descriptor ?? {}).sort(), ...payload };
          publish(next);
          world.emit(ObjectProofHashRecorded, { id, hash, descriptorShape: next.objectProof.outputHashes[id].descriptorShape });
          return clone(next.objectProof.outputHashes[id]);
        },
        objectProofSnapshot() {
          return clone(state().objectProof ?? createObjectProofRegistry());
        },
        resolve: (request = {}) => resolveContentMode(state(), request),
        listNamespaces: () => asList(Object.keys(state().namespaces)),
        snapshot: () => clone(state())
      };
    },
    metadata: { version: DATA_REGISTRY_KIT_VERSION, purpose: "Root static/seeded/hybrid game data registry with bounded object proof spec, seed, schema, and output-hash containment." }
  });
}
