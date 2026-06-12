import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const INTERACTION_KIT_VERSION = "0.0.1";

export function createInteractable(options = {}) {
  return { id: options.id ?? `interactable-${Math.round((options.x ?? 0) * 100)}-${Math.round((options.y ?? 0) * 100)}`, x: options.x ?? 0, y: options.y ?? 0, radius: options.radius ?? 0.45, label: options.label ?? "Interact", action: options.action ?? "interact", enabled: options.enabled ?? true, payload: options.payload ?? null, onUse: options.onUse ?? null };
}

export function findFocusedInteractable(camera, items = [], options = {}) {
  const maxDistance = options.maxDistance ?? 1.8;
  const maxAngle = options.maxAngle ?? 0.32;
  let best = null;
  for (const item of items) {
    if (!item.enabled) continue;
    const dx = item.x - camera.x;
    const dy = item.y - camera.y;
    const distance = Math.hypot(dx, dy);
    if (distance > maxDistance + (item.radius ?? 0)) continue;
    const facing = Math.atan2(dy, dx) - camera.yaw;
    const angle = Math.atan2(Math.sin(facing), Math.cos(facing));
    const score = Math.abs(angle) + distance * 0.08;
    if (Math.abs(angle) <= maxAngle + (item.radius ?? 0) / Math.max(distance, 0.1) && (!best || score < best.score)) best = { item, distance, angle, score };
  }
  return best;
}

export function createInteractionRegistry(options = {}) {
  const items = [];
  return {
    items,
    add(item) { const next = createInteractable(item); items.push(next); return next; },
    remove(id) { const index = items.findIndex((item) => item.id === id); if (index >= 0) items.splice(index, 1); },
    focus(camera, focusOptions = {}) { return findFocusedInteractable(camera, items, { ...options.focus, ...focusOptions }); },
    use(camera, context = {}) { const focus = this.focus(camera, context.focusOptions); if (!focus) return null; focus.item.onUse?.({ item: focus.item, focus, context }); return focus.item; }
  };
}

export function createInteractionKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "interaction-kit", version: INTERACTION_KIT_VERSION, createInteractable, findFocusedInteractable, createInteractionRegistry };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusRealtime, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["interaction:focus", "interaction:items", "interaction:prompts"], bindings: { interactionKit: kit }, metadata: { version: INTERACTION_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
