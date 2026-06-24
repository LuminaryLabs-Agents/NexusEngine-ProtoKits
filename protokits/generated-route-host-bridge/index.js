import { clone } from "../protokit-core/index.js";
import { createHostShellDescriptor, normalizeHostShellContract } from "../host-shell-contract-kit/index.js";

export const GENERATED_ROUTE_HOST_BRIDGE_VERSION = "0.1.0";

export function createGeneratedRouteHostBridge(config = {}) {
  const contract = normalizeHostShellContract({
    id: config.id ?? "generated-route-host",
    hostKind: "browser-generated-route",
    canvas: { selector: config.canvasSelector ?? "#game", required: true },
    hud: { mode: "dom-bridge", fields: ["title", "status", "readout"] },
    errors: { surface: "#err", exposeStack: true },
    frameLoop: { owner: "host", targetFps: 60, maxDelta: 0.05 },
    restart: { supported: true, command: "restart" },
    debug: { exposeGlobalHost: true, snapshotMethod: "getState" },
    metadata: clone(config.metadata ?? {})
  });
  return {
    version: GENERATED_ROUTE_HOST_BRIDGE_VERSION,
    contract,
    describe(runtime = {}) { return createHostShellDescriptor(contract, runtime); },
    snapshot() { return { version: GENERATED_ROUTE_HOST_BRIDGE_VERSION, contract: clone(contract) }; }
  };
}

export default createGeneratedRouteHostBridge;
