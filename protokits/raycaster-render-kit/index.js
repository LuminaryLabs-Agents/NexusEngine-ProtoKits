import { clamp, defineInjectedRuntimeKit } from "../foundation-kit/index.js";
import { createGridSampler, castGridRay } from "../raycast-placement-kit/index.js";

export const RAYCASTER_RENDER_KIT_VERSION = "0.0.1";

export function createRaycasterScene(map, options = {}) {
  return { id: options.id ?? "raycaster-scene", grid: createGridSampler(map, options.grid), map, props: [...(options.props ?? [])], materials: options.materials ?? null, decals: [...(options.decals ?? [])], background: options.background ?? { skyTop: "#0d1420", skyBottom: "#33291e", floorTop: "#46392d", floorBottom: "#0b0b0b" } };
}

export function renderRaycasterBackground(ctx, width, height, background = {}) {
  const sky = ctx.createLinearGradient(0, 0, 0, height * 0.55);
  sky.addColorStop(0, background.skyTop ?? "#0d1420");
  sky.addColorStop(1, background.skyBottom ?? "#33291e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height * 0.55);
  const floor = ctx.createLinearGradient(0, height * 0.55, 0, height);
  floor.addColorStop(0, background.floorTop ?? "#46392d");
  floor.addColorStop(1, background.floorBottom ?? "#0b0b0b");
  ctx.fillStyle = floor;
  ctx.fillRect(0, height * 0.55, width, height * 0.45);
}

export function colorForTile(tile, distance, options = {}) {
  const shade = clamp(1 - distance / (options.fadeDistance ?? 12), 0, 1);
  if (typeof options.colorForTile === "function") return options.colorForTile(tile, distance, shade);
  if (tile === "#") return `rgb(${50 + 75 * shade},${48 + 55 * shade},${42 + 35 * shade})`;
  if (tile === "G") return `rgb(${70 + 100 * shade},${30 + 50 * shade},${20 + 25 * shade})`;
  return `rgb(${115 + 95 * shade},${85 + 75 * shade},${35 + 50 * shade})`;
}

export function renderRaycasterWalls(ctx, scene, camera, view = {}) {
  const width = view.width ?? ctx.canvas.width;
  const height = view.height ?? ctx.canvas.height;
  const fov = view.fov ?? Math.PI / 3;
  const columns = Math.max(1, Math.floor(width / (view.columnWidth ?? 3)));
  const columnWidth = width / columns;
  const depth = new Float32Array(columns);
  for (let column = 0; column < columns; column += 1) {
    const angle = camera.yaw - fov / 2 + (fov * column) / columns;
    const hit = castGridRay(scene.grid, camera, angle, { maxDistance: view.maxDistance ?? 16, step: view.step ?? 0.025 });
    const corrected = hit.distance * Math.cos(angle - camera.yaw);
    depth[column] = corrected;
    const wallHeight = Math.min(height, (height / Math.max(0.02, corrected)) * (view.wallScale ?? 0.78));
    const x = column * columnWidth;
    const y = height / 2 - wallHeight / 2 + (camera.pitch ?? 0) * height * 0.45;
    const tile = hit.tile ?? ".";
    let fill = colorForTile(tile, corrected, view);
    if (scene.materials?.sample && view.textureSampler) {
      const surface = scene.materials.sample(hit.x, hit.y);
      fill = view.textureSampler(surface.wall ?? surface.floor, hit.x, hit.y);
    }
    if (view.fog?.mixFogColor) fill = view.fog.mixFogColor(fill, corrected, view.fogOptions);
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, Math.ceil(columnWidth) + 1, wallHeight);
    if (tile !== "#" && tile !== ".") {
      ctx.fillStyle = "rgba(255,226,120,.95)";
      ctx.fillRect(x, y + wallHeight * 0.12, Math.ceil(columnWidth) + 1, Math.max(3, wallHeight * 0.06));
    }
  }
  return { depth, depthAt(screenX) { const index = clamp(Math.floor((screenX / width) * columns), 0, columns - 1); return depth[index] ?? Infinity; } };
}

export function createRaycasterRenderer(canvas, scene, options = {}) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("createRaycasterRenderer requires a 2D canvas context.");
  function resize() {
    const dpr = Math.min(options.maxDpr ?? 2, globalThis.devicePixelRatio || 1);
    const width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { width: canvas.clientWidth || width / dpr, height: canvas.clientHeight || height / dpr, dpr };
  }
  return { id: options.id ?? "raycaster-renderer", ctx, canvas, scene, render(camera, renderOptions = {}) { const size = resize(); const view = { ...options.view, ...renderOptions, width: size.width, height: size.height }; renderRaycasterBackground(ctx, size.width, size.height, scene.background); return renderRaycasterWalls(ctx, scene, camera, view); } };
}

export function createRaycasterRenderKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "raycaster-render-kit", version: RAYCASTER_RENDER_KIT_VERSION, createRaycasterScene, renderRaycasterBackground, renderRaycasterWalls, createRaycasterRenderer, colorForTile };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["render:raycaster", "render:walls", "render:depth-buffer"], requires: runtimeOptions.requires ?? [], bindings: { raycasterRenderKit: kit }, metadata: { version: RAYCASTER_RENDER_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
