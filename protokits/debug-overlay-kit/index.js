import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const DEBUG_OVERLAY_KIT_VERSION = "0.0.1";

export function createDebugOverlay(root = globalThis.document?.body, options = {}) {
  if (!root?.appendChild || !globalThis.document?.createElement) return { update() {}, setVisible() {}, destroy() {} };
  const element = globalThis.document.createElement("pre");
  element.style.cssText = options.cssText ?? "position:fixed;right:12px;bottom:12px;z-index:9999;margin:0;padding:8px 10px;background:rgba(0,0,0,.58);color:#ffe7a1;border:1px solid rgba(255,220,120,.25);border-radius:8px;font:12px ui-monospace,Menlo,Consolas,monospace;pointer-events:none;max-width:360px;white-space:pre-wrap";
  root.appendChild(element);
  let visible = options.visible ?? true;
  function setVisible(next) { visible = Boolean(next); element.style.display = visible ? "block" : "none"; }
  setVisible(visible);
  return {
    element,
    update(values = {}) { if (!visible) return; element.textContent = Object.entries(values).map(([key, value]) => `${key}: ${typeof value === "number" ? value.toFixed?.(3) ?? value : value}`).join("\n"); },
    setVisible,
    destroy() { element.remove(); }
  };
}

export function drawDebugMiniMap(ctx, map, camera, options = {}) {
  const rows = Array.isArray(map) ? map : [];
  const scale = options.scale ?? 6;
  const x0 = options.x ?? 12;
  const y0 = options.y ?? 12;
  ctx.save();
  ctx.globalAlpha = options.alpha ?? 0.85;
  ctx.fillStyle = "rgba(0,0,0,.45)";
  ctx.fillRect(x0 - 6, y0 - 6, (rows[0]?.length ?? 0) * scale + 12, rows.length * scale + 12);
  for (let y = 0; y < rows.length; y += 1) for (let x = 0; x < rows[y].length; x += 1) {
    ctx.fillStyle = rows[y][x] === "#" ? "#70624f" : rows[y][x] === "." ? "rgba(255,255,255,.06)" : "#d9a33d";
    ctx.fillRect(x0 + x * scale, y0 + y * scale, scale - 1, scale - 1);
  }
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(x0 + camera.x * scale, y0 + camera.y * scale, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(x0 + camera.x * scale, y0 + camera.y * scale);
  ctx.lineTo(x0 + (camera.x + Math.cos(camera.yaw) * 0.85) * scale, y0 + (camera.y + Math.sin(camera.yaw) * 0.85) * scale);
  ctx.stroke();
  ctx.restore();
}

export function createDebugOverlayKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "debug-overlay-kit", version: DEBUG_OVERLAY_KIT_VERSION, createDebugOverlay, drawDebugMiniMap };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["debug:overlay", "debug:minimap"], bindings: { debugOverlayKit: kit }, metadata: { version: DEBUG_OVERLAY_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
