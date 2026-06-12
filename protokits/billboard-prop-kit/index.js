import { clamp, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const BILLBOARD_PROP_KIT_VERSION = "0.0.1";

export function createBillboard(options = {}) {
  return { id: options.id ?? `billboard-${Math.round((options.x ?? 0) * 100)}-${Math.round((options.y ?? 0) * 100)}`, x: options.x ?? 0, y: options.y ?? 0, z: options.z ?? 0, width: options.width ?? options.radius ?? 0.4, height: options.height ?? 0.6, color: options.color ?? "#d9a33d", label: options.label ?? "", sprite: options.sprite ?? null, type: options.type ?? "prop", alpha: options.alpha ?? 1 };
}

export function projectBillboard(camera, billboard, view = {}) {
  const fov = view.fov ?? Math.PI / 3;
  const width = view.width ?? 800;
  const height = view.height ?? 450;
  const dx = billboard.x - camera.x;
  const dy = billboard.y - camera.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) - camera.yaw;
  const wrapped = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (Math.abs(wrapped) > fov * 0.64 || distance <= 0.03) return null;
  const screenX = (0.5 + wrapped / fov) * width;
  const size = (height / Math.max(distance, 0.1)) * (view.scale ?? 0.48);
  const horizon = height * (view.horizon ?? 0.52);
  const pitchOffset = (camera.pitch ?? 0) * height * 0.45;
  const screenH = size * billboard.height;
  const screenW = size * billboard.width;
  const screenY = horizon + pitchOffset - screenH * (0.5 + (billboard.z ?? 0));
  return { ...billboard, distance, screenX, screenY, screenW, screenH, visible: true };
}

export function sortBillboards(camera, billboards = []) {
  return billboards.map((billboard) => ({ billboard, distance: Math.hypot(billboard.x - camera.x, billboard.y - camera.y) })).sort((a, b) => b.distance - a.distance).map(({ billboard }) => billboard);
}

export function drawBillboards(ctx, camera, billboards = [], view = {}) {
  const drawn = [];
  for (const billboard of sortBillboards(camera, billboards)) {
    const projection = projectBillboard(camera, billboard, view);
    if (!projection) continue;
    if (view.depthAt && projection.distance > view.depthAt(projection.screenX)) continue;
    ctx.save();
    ctx.globalAlpha = clamp(projection.alpha ?? 1, 0, 1) * clamp(1 - projection.distance / (view.fadeDistance ?? 18), 0, 1);
    if (projection.sprite && projection.sprite.complete !== false) ctx.drawImage(projection.sprite, projection.screenX - projection.screenW / 2, projection.screenY, projection.screenW, projection.screenH);
    else {
      ctx.fillStyle = projection.color;
      ctx.fillRect(projection.screenX - projection.screenW / 2, projection.screenY, projection.screenW, projection.screenH);
      ctx.fillStyle = "rgba(255,238,180,.5)";
      ctx.fillRect(projection.screenX - projection.screenW / 2, projection.screenY, projection.screenW, Math.max(2, projection.screenH * 0.12));
    }
    if (projection.label && projection.distance < (view.labelDistance ?? 2.2)) {
      ctx.fillStyle = "#fff3c9";
      ctx.font = `${view.labelSize ?? 12}px ui-monospace, Menlo, Consolas, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(projection.label, projection.screenX, projection.screenY - 6);
    }
    ctx.restore();
    drawn.push(projection);
  }
  return drawn;
}

export function createBillboardPropKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "billboard-prop-kit", version: BILLBOARD_PROP_KIT_VERSION, createBillboard, projectBillboard, sortBillboards, drawBillboards };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusRealtime, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["render:billboards", "detail:props"], bindings: { billboardPropKit: kit }, metadata: { version: BILLBOARD_PROP_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
