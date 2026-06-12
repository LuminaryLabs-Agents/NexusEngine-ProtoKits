export function createInput(target = globalThis) {
  const held = new Set();
  const pressed = new Set();
  const down = (event) => {
    const key = event.key.toLowerCase();
    if (!held.has(key)) pressed.add(key);
    held.add(key);
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) event.preventDefault?.();
  };
  const up = (event) => held.delete(event.key.toLowerCase());
  target.addEventListener?.("keydown", down);
  target.addEventListener?.("keyup", up);
  return {
    tap(key) {
      const hit = pressed.has(key);
      pressed.delete(key);
      return hit;
    },
    down(key) {
      return held.has(key);
    },
    axis() {
      return {
        forward: (held.has("w") || held.has("arrowup") ? 1 : 0) - (held.has("s") || held.has("arrowdown") ? 1 : 0),
        turn: (held.has("d") || held.has("arrowright") ? 1 : 0) - (held.has("a") || held.has("arrowleft") ? 1 : 0),
        boost: held.has("shift")
      };
    },
    finishFrame() {
      pressed.clear();
    },
    destroy() {
      target.removeEventListener?.("keydown", down);
      target.removeEventListener?.("keyup", up);
    }
  };
}
