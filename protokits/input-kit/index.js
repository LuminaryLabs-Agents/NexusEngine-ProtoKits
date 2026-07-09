import { clamp, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const INPUT_KIT_VERSION = "0.0.1";

export function createInputState() {
  return {
    keys: new Set(),
    buttons: new Set(),
    pointer: { x: 0, y: 0, dx: 0, dy: 0, dragging: false, locked: false },
    actions: new Map(),
    destroyed: false
  };
}

export function createKeyboardMouseInput(options = {}) {
  const target = options.target ?? globalThis;
  const canvas = options.canvas ?? null;
  const state = createInputState();
  const bindings = {
    forward: ["w", "arrowup"],
    back: ["s", "arrowdown"],
    left: ["a", "arrowleft"],
    right: ["d", "arrowright"],
    interact: ["e"],
    build: ["b"],
    reset: ["r"],
    sprint: ["shift"],
    ...(options.bindings ?? {})
  };

  let lastPointerX = 0;
  let lastPointerY = 0;

  function normalizeKey(key) {
    return String(key || "").toLowerCase();
  }

  function setAction(action, active) {
    state.actions.set(action, Boolean(active));
  }

  function syncActions() {
    for (const [action, keys] of Object.entries(bindings)) {
      setAction(action, keys.some((key) => state.keys.has(normalizeKey(key))));
    }
  }

  function down(event) {
    state.keys.add(normalizeKey(event.key));
    syncActions();
  }

  function up(event) {
    state.keys.delete(normalizeKey(event.key));
    syncActions();
  }

  function pointerMove(event) {
    state.pointer.x = event.clientX ?? state.pointer.x;
    state.pointer.y = event.clientY ?? state.pointer.y;
    state.pointer.locked = globalThis.document?.pointerLockElement === canvas;
    if (state.pointer.locked) {
      state.pointer.dx += event.movementX ?? 0;
      state.pointer.dy += event.movementY ?? 0;
      return;
    }
    if (state.pointer.dragging) {
      state.pointer.dx += state.pointer.x - lastPointerX;
      state.pointer.dy += state.pointer.y - lastPointerY;
    }
    lastPointerX = state.pointer.x;
    lastPointerY = state.pointer.y;
  }

  function pointerDown(event) {
    state.pointer.dragging = true;
    state.pointer.x = event.clientX ?? state.pointer.x;
    state.pointer.y = event.clientY ?? state.pointer.y;
    lastPointerX = state.pointer.x;
    lastPointerY = state.pointer.y;
    state.buttons.add(event.button ?? 0);
    canvas?.setPointerCapture?.(event.pointerId);
  }

  function pointerUp(event) {
    state.pointer.dragging = false;
    state.buttons.delete(event.button ?? 0);
    canvas?.releasePointerCapture?.(event.pointerId);
  }

  function click() {
    canvas?.requestPointerLock?.();
  }

  target.addEventListener?.("keydown", down);
  target.addEventListener?.("keyup", up);
  target.addEventListener?.("mousemove", pointerMove);
  canvas?.addEventListener?.("pointerdown", pointerDown);
  canvas?.addEventListener?.("pointermove", pointerMove);
  canvas?.addEventListener?.("pointerup", pointerUp);
  canvas?.addEventListener?.("click", click);

  return {
    id: "keyboard-mouse-input",
    state,
    bindings,
    isDown: (key) => state.keys.has(normalizeKey(key)),
    action: (name) => Boolean(state.actions.get(name)),
    readMovement() {
      const x = (this.action("right") ? 1 : 0) - (this.action("left") ? 1 : 0);
      const y = (this.action("forward") ? 1 : 0) - (this.action("back") ? 1 : 0);
      const length = Math.hypot(x, y) || 1;
      return { x: x / length, y: y / length, sprint: this.action("sprint") };
    },
    consumePointerDelta(scale = 1) {
      const delta = { x: state.pointer.dx * scale, y: state.pointer.dy * scale, locked: state.pointer.locked };
      state.pointer.dx = 0;
      state.pointer.dy = 0;
      return delta;
    },
    clearTransient() {
      state.pointer.dx = 0;
      state.pointer.dy = 0;
    },
    destroy() {
      if (state.destroyed) return;
      state.destroyed = true;
      target.removeEventListener?.("keydown", down);
      target.removeEventListener?.("keyup", up);
      target.removeEventListener?.("mousemove", pointerMove);
      canvas?.removeEventListener?.("pointerdown", pointerDown);
      canvas?.removeEventListener?.("pointermove", pointerMove);
      canvas?.removeEventListener?.("pointerup", pointerUp);
      canvas?.removeEventListener?.("click", click);
    }
  };
}

export function createInputKit(nexusEngine = {}, options = {}) {
  const kit = {
    id: options.id ?? "input-kit",
    version: INPUT_KIT_VERSION,
    createInputState,
    createKeyboardMouseInput,
    deadzone(value, amount = 0.12) {
      const magnitude = Math.abs(value);
      if (magnitude <= amount) return 0;
      return Math.sign(value) * clamp((magnitude - amount) / (1 - amount), 0, 1);
    }
  };

  return Object.freeze({
    ...kit,
    createRuntimeKit(runtimeOptions = {}) {
      return defineInjectedRuntimeKit(nexusEngine, {
        id: runtimeOptions.id ?? kit.id,
        provides: runtimeOptions.provides ?? ["input:keyboard-mouse", "input:actions", "input:pointer-look"],
        bindings: { inputKit: kit },
        metadata: { version: INPUT_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) }
      });
    }
  });
}
