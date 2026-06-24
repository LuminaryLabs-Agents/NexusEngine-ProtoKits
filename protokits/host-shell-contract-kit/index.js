import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const HOST_SHELL_CONTRACT_KIT_VERSION = "0.1.0";

export function normalizeHostShellContract(input = {}) {
  return {
    version: input.version ?? HOST_SHELL_CONTRACT_KIT_VERSION,
    id: String(input.id ?? "host-shell"),
    hostKind: String(input.hostKind ?? input.kind ?? "browser"),
    canvas: clone(input.canvas ?? { selector: "#game", required: true }),
    input: clone(input.input ?? { contexts: ["default"], captureKeyboard: true, capturePointer: true }),
    hud: clone(input.hud ?? { mode: "descriptor", fields: ["title", "status", "readout"] }),
    errors: clone(input.errors ?? { surface: "overlay", exposeStack: true }),
    frameLoop: clone(input.frameLoop ?? { owner: "host", targetFps: 60, maxDelta: 0.05 }),
    restart: clone(input.restart ?? { supported: true, command: "restart" }),
    debug: clone(input.debug ?? { exposeGlobalHost: false, snapshotMethod: "getSnapshot" }),
    rendererBoundary: {
      ownsDom: true,
      ownsCanvas: true,
      ownsGameplayRules: false,
      ownsSimulation: false,
      ...(input.rendererBoundary ?? {})
    },
    metadata: clone(input.metadata ?? {})
  };
}

export function createHostShellDescriptor(contractInput = {}, runtime = {}) {
  const contract = normalizeHostShellContract(contractInput);
  return {
    version: HOST_SHELL_CONTRACT_KIT_VERSION,
    contract,
    title: runtime.title ?? contract.metadata.title ?? contract.id,
    status: runtime.status ?? "ready",
    readout: runtime.readout ?? "",
    commands: asList(runtime.commands),
    diagnostics: clone(runtime.diagnostics ?? {})
  };
}

export function createHostShellContractKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const HostShellContractState = resource(options.resourceName ?? "hostShellContract.state");
  const HostShellContractUpdated = event("hostShellContract.updated");
  const createState = () => ({ version: HOST_SHELL_CONTRACT_KIT_VERSION, contract: normalizeHostShellContract(options.contract ?? options), descriptors: [] });
  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "host-shell-contract-kit",
    resources: { HostShellContractState },
    events: { HostShellContractUpdated },
    provides: ["host-shell-contract", "hud-descriptor-contract", "frame-loop-contract"],
    initWorld({ world }) { ensureResource(world, HostShellContractState, createState); },
    install({ engine, world }) {
      const state = () => ensureResource(world, HostShellContractState, createState);
      engine.hostShellContract = {
        configure(contractInput = {}) {
          const next = state();
          next.contract = normalizeHostShellContract({ ...next.contract, ...contractInput });
          world.setResource(HostShellContractState, next);
          world.emit(HostShellContractUpdated, { contract: clone(next.contract) });
          return clone(next.contract);
        },
        describe(runtime = {}) {
          const descriptor = createHostShellDescriptor(state().contract, runtime);
          const next = state();
          next.descriptors = [...(next.descriptors ?? []).slice(-31), descriptor];
          world.setResource(HostShellContractState, next);
          return clone(descriptor);
        },
        getState() { return clone(state()); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: HOST_SHELL_CONTRACT_KIT_VERSION, purpose: "Declarative host shell, HUD, frame-loop, error, restart, and debug contracts without owning gameplay rules." }
  });
}

export default createHostShellContractKit;
