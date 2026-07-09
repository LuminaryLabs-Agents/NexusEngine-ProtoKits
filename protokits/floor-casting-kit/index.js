import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const FLOOR_CASTING_KIT_VERSION = "0.0.1";

export function renderFloorCasting(ctx, camera, options = {}) {
  const width = options.width ?? ctx.canvas.clientWidth ?? ctx.canvas.width;
  const height = options.height ?? ctx.canvas.clientHeight ?? ctx.canvas.height;
  const horizon = height * (options.horizon ?? 0.55) + (camera.pitch ?? 0) * height * 0.45;
  const fov = options.fov ?? Math.PI / 3;
  const sampler = options.sampler ?? (() => options.defaultColor ?? "#403326");
  const stepY = options.stepY ?? 2;
  const stepX = options.stepX ?? 3;
  for (let screenY = Math.max(0, Math.floor(horizon)); screenY < height; screenY += stepY) {
    const rowDistance = (options.eyeHeight ?? camera.height ?? 0.72) / Math.max(0.001, (screenY - horizon) / height);
    for (let screenX = 0; screenX < width; screenX += stepX) {
      const cameraX = (screenX / width - 0.5) * 2;
      const angle = camera.yaw + Math.atan(cameraX * Math.tan(fov / 2));
      const worldX = camera.x + Math.cos(angle) * rowDistance;
      const worldY = camera.y + Math.sin(angle) * rowDistance;
      ctx.fillStyle = sampler(worldX, worldY, rowDistance, screenX, screenY);
      ctx.fillRect(screenX, screenY, stepX + 1, stepY + 1);
    }
  }
}

export function createFloorSampler(options = {}) {
  const surfaceMap = options.surfaceMap;
  const textureSampler = options.textureSampler;
  const decalSampler = options.decalSampler;
  const defaultMaterial = options.defaultMaterial ?? "dirt";
  return function floorSampler(x, y, distance) {
    const surface = surfaceMap?.sample?.(x, y) ?? { floor: defaultMaterial };
    const decal = decalSampler?.(x, y);
    const material = decal?.decal?.material ?? surface.floor ?? defaultMaterial;
    return textureSampler?.(material, x, y, { distance, decal }) ?? options.fallbackColor ?? "#403326";
  };
}

export function createFloorCastingKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "floor-casting-kit", version: FLOOR_CASTING_KIT_VERSION, renderFloorCasting, createFloorSampler };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["render:floor-casting", "surface:floor-sampling"], bindings: { floorCastingKit: kit }, metadata: { version: FLOOR_CASTING_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
