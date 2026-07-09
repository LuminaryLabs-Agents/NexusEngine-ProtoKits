import { createInput } from "./input.js";
import { createErrorOverlay, createBlackwakeHud, updateBlackwakeHud } from "./hud.js";
import { createBlackwakeRenderer } from "./renderer.js";
import { canUseBlackwakeThreeRenderer, createBlackwakeThreeRenderer } from "./three-renderer.js";
import { createBlackwakeState, updateBlackwakeState } from "./simulation.js";
import { createBlackwakeProtoKit } from "../blackwake-kit-registry/index.js";

export const BLACKWAKE_GAMEPLAY_VERSION = "0.3.1";

export function createBlackwakeHealthReport(NexusEngine, canvas, options = {}) {
  const wantsThree = options.renderer === "three" || Boolean(options.three || options.THREE);
  const checks = [
    ["NexusEngine object", Boolean(NexusEngine)],
    ["defineRuntimeKit", typeof NexusEngine?.defineRuntimeKit === "function"],
    ["defineResource", typeof NexusEngine?.defineResource === "function"],
    ["defineEvent", typeof NexusEngine?.defineEvent === "function"],
    ["createRealtimeGame", typeof NexusEngine?.createRealtimeGame === "function"],
    ["canvas", Boolean(canvas)],
    ["canvas getContext", typeof canvas?.getContext === "function"],
    ["Three renderer module", wantsThree ? canUseBlackwakeThreeRenderer(options) : true]
  ];
  const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
  return Object.freeze({ ok: failed.length === 0, failed, checks: Object.freeze(checks.map(([name, ok]) => ({ name, ok }))) });
}

function createGameplayRuntimeKit(NexusEngine, runtime, id) {
  if (typeof NexusEngine?.defineRuntimeKit !== "function" || typeof NexusEngine?.defineResource !== "function" || typeof NexusEngine?.defineEvent !== "function") return null;
  const State = NexusEngine.defineResource(`${id}:state`);
  const Ticked = NexusEngine.defineEvent(`${id}:ticked`);
  const PhaseChanged = NexusEngine.defineEvent(`${id}:phase-changed`);
  return NexusEngine.defineRuntimeKit({
    id: `${id}:playable-runtime`,
    provides: [`gameplay:${id}`, "gameplay:blackwake-playable"],
    resources: { State },
    events: { Ticked, PhaseChanged },
    systems: [{
      phase: "simulate",
      name: `${id}:playable-update`,
      system(world) {
        const state = world.getResource(State);
        const before = state.quest.phase;
        runtime.update(world.__nexusClock?.delta ?? 1 / 60, world.__nexusClock?.elapsed ?? state.time);
        if (before !== state.quest.phase) world.emit(PhaseChanged, { previousPhase: before, nextPhase: state.quest.phase });
        world.emit(Ticked, { frame: state.frame, mode: state.player.mode, phase: state.quest.phase });
        runtime.engineFrame = world.__nexusClock?.frame ?? runtime.engineFrame;
      }
    }],
    initWorld({ world }) {
      world.setResource(State, runtime.state);
    },
    bindings: {
      blackwakePlayableState: runtime.state,
      blackwakePlayableRuntime: runtime
    },
    metadata: {
      protoKit: id,
      tier: "gameplay",
      status: "playable"
    }
  });
}

function makeRenderer(canvas, state, options) {
  if ((options.renderer === "three" || options.three || options.THREE) && canUseBlackwakeThreeRenderer(options)) {
    return createBlackwakeThreeRenderer(canvas, state, options);
  }
  return createBlackwakeRenderer(canvas, state, options);
}

export function createBlackwakePlayableGame(NexusEngine, gameId = "blackwake-game-isles", options = {}) {
  const canvas = options.canvas;
  if (!canvas) throw new Error("createBlackwakePlayableGame requires a canvas.");
  const health = createBlackwakeHealthReport(NexusEngine, canvas, options);
  if (!health.ok && options.showHealthOverlay !== false && typeof document !== "undefined") {
    createErrorOverlay(options.overlayRoot || document.body, "Blackwake startup warning", `Missing: ${health.failed.join(", ")}\nThe game will use available fallbacks where possible.`);
  }
  const input = options.input || createInput(options.inputTarget || globalThis);
  const state = createBlackwakeState(options);
  const renderer = makeRenderer(canvas, state, options);
  const hud = options.hud === false ? null : createBlackwakeHud(options.hudRoot || document.body);
  const runtime = {
    state,
    engineFrame: -1,
    update(delta, time) {
      updateBlackwakeState(state, input, delta, time);
      updateBlackwakeHud(hud, state);
      options.onUpdate?.({ state, delta, time, renderer });
    },
    render() {
      renderer.render();
      options.onRender?.({ state, renderer });
    },
    destroy() {
      input.destroy?.();
      renderer.destroy?.();
      hud?.destroy?.();
    }
  };
  const registryProtoKit = createBlackwakeProtoKit(NexusEngine, gameId, { status: "playable-scaffold", ...(options.protoKitOptions ?? {}) });
  const gameplayKit = createGameplayRuntimeKit(NexusEngine, runtime, gameId);
  const kits = gameplayKit ? [...registryProtoKit.kits, gameplayKit] : registryProtoKit.kits;
  const engine = typeof NexusEngine?.createRealtimeGame === "function" ? NexusEngine.createRealtimeGame({ ...(options.engine ?? {}), canvas, kits }) : null;
  let running = false;
  let last = 0;
  let errorOverlay = null;
  function frame(now) {
    if (!running) return;
    try {
      const delta = Math.min(options.maxDelta ?? 0.033, (now - last) / 1000 || 1 / 60);
      last = now;
      if (engine?.tick) {
        const before = runtime.engineFrame;
        engine.tick(delta);
        if (runtime.engineFrame === before) runtime.update(delta, state.time + delta);
      } else {
        runtime.update(delta, state.time + delta);
      }
      runtime.render();
      globalThis.requestAnimationFrame?.(frame);
    } catch (error) {
      running = false;
      if (!errorOverlay && typeof document !== "undefined") errorOverlay = createErrorOverlay(options.overlayRoot || document.body, "Blackwake runtime error", error?.stack || String(error));
      options.onError?.(error);
    }
  }
  return Object.freeze({
    id: gameId,
    version: BLACKWAKE_GAMEPLAY_VERSION,
    health,
    protoKit: Object.freeze({ ...registryProtoKit, kits: Object.freeze(kits), installOrder: Object.freeze(kits.map((kit) => kit.id)) }),
    engine,
    state,
    runtime,
    renderer,
    start() {
      if (running) return;
      running = true;
      last = globalThis.performance?.now?.() ?? 0;
      globalThis.requestAnimationFrame?.(frame);
    },
    stop() {
      running = false;
    },
    tick(delta = 1 / 60) {
      if (engine?.tick) engine.tick(delta); else runtime.update(delta, state.time + delta);
      runtime.render();
    },
    destroy() {
      running = false;
      runtime.destroy();
      errorOverlay?.remove?.();
    }
  });
}
