import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const AERIAL_PATCH_WINDOW_DOMAIN_KIT_VERSION = "0.1.0";

export function createAerialPatchWindowDomainKit(NexusRealtime = {}, config = {}) {
  const State = typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(config.resourceName ?? "aerialPatchWindow.state") : `resource:${config.resourceName ?? "aerialPatchWindow.state"}`;
  const initialState = () => ({ id: config.id ?? "aerial-patch-window", version: AERIAL_PATCH_WINDOW_DOMAIN_KIT_VERSION, patches: [], activeChunks: {}, dirtyPatchIds: [], removedPatchIds: [], streamingStats: { desired: 0, ready: 0, dirty: 0, removed: 0, cached: 0, lodCounts: {} } });
  return defineInjectedRuntimeKit(NexusRealtime, {
    id: config.kitId ?? "aerial-patch-window-domain-kit",
    requires: config.requires ?? [],
    provides: ["world:patch-window", "world:streaming-descriptors", "world:terrain-lod"],
    resources: { State },
    systems: [],
    initWorld({ world }) { world.setResource(State, initialState()); },
    install({ engine, world }) {
      engine.aerialPatchWindow = { getState() { return world.getResource(State); }, reset() { world.setResource(State, initialState()); return world.getResource(State); } };
      engine.genericWorldPatch ??= engine.aerialPatchWindow;
      engine.terrainStreamer ??= engine.aerialPatchWindow;
    },
    metadata: { version: AERIAL_PATCH_WINDOW_DOMAIN_KIT_VERSION, domain: "aerial-patch-window", purpose: "Dependency provider for aerial patch-window composition. Full streaming can be swapped in without changing dependent kits." }
  });
}

export default createAerialPatchWindowDomainKit;
