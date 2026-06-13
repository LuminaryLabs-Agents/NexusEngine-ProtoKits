import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, scopedSeed } from "../protokit-core/index.js";

export const DATA_REGISTRY_KIT_VERSION = "0.1.0";

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

export function createDataRegistryKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const GameDataState = resource(options.resourceName ?? "gameData.state");
  const GameDataUpdated = event("gameData.updated");
  const GameDataNamespaceRegistered = event("gameData.namespaceRegistered");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "data-registry-kit",
    resources: { GameDataState },
    events: { GameDataUpdated, GameDataNamespaceRegistered },
    provides: ["data-registry", "game-data"],
    initWorld({ world }) { ensureResource(world, GameDataState, () => createGameDataState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, GameDataState, () => createGameDataState(options));
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
          world.setResource(GameDataState, next);
          world.emit(GameDataUpdated, { path, value: clone(value) });
          return value;
        },
        registerNamespace(name, value = {}) {
          const next = state();
          next.namespaces[name] = clone(value);
          next.raw[name] = next.raw[name] ?? clone(value);
          world.setResource(GameDataState, next);
          world.emit(GameDataNamespaceRegistered, { name, value: clone(value) });
          return next.namespaces[name];
        },
        resolve: (request = {}) => resolveContentMode(state(), request),
        listNamespaces: () => asList(Object.keys(state().namespaces)),
        snapshot: () => clone(state())
      };
    },
    metadata: { version: DATA_REGISTRY_KIT_VERSION, purpose: "Root static/seeded/hybrid game data registry." }
  });
}
