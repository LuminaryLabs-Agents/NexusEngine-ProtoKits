import { distance2, defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const RAYCAST_PLACEMENT_KIT_VERSION = "0.0.1";

export function createGridSampler(map, options = {}) {
  const rows = Array.isArray(map) ? map.map(String) : [];
  const solidTiles = new Set(options.solidTiles ?? ["#"]);
  const width = Math.max(0, ...rows.map((row) => row.length));
  const height = rows.length;
  const outOfBoundsTile = options.outOfBoundsTile ?? "#";
  function cell(x, y) {
    const row = rows[Math.floor(y)];
    return row?.[Math.floor(x)] ?? outOfBoundsTile;
  }
  return { rows, width, height, cell, isSolid: (x, y) => solidTiles.has(cell(x, y)), isInside: (x, y) => x >= 0 && y >= 0 && x < width && y < height, isOpen(x, y) { return this.isInside(x, y) && !this.isSolid(x, y); } };
}

export function castGridRay(grid, origin, angle, options = {}) {
  const step = options.step ?? 0.025;
  const maxDistance = options.maxDistance ?? 16;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let distance = 0;
  while (distance < maxDistance) {
    distance += step;
    const x = origin.x + dx * distance;
    const y = origin.y + dy * distance;
    if (grid.isSolid(x, y)) return { hit: true, x, y, distance, tile: grid.cell(x, y) };
  }
  return { hit: false, x: origin.x + dx * maxDistance, y: origin.y + dy * maxDistance, distance: maxDistance, tile: null };
}

export function nearestWallDistance(grid, x, y, radius = 2) {
  let best = Infinity;
  for (let cy = Math.floor(y - radius); cy <= Math.ceil(y + radius); cy += 1) {
    for (let cx = Math.floor(x - radius); cx <= Math.ceil(x + radius); cx += 1) {
      if (grid.isSolid(cx + 0.5, cy + 0.5)) best = Math.min(best, Math.hypot(cx + 0.5 - x, cy + 0.5 - y));
    }
  }
  return best;
}

export function createPlacementValidator(map, options = {}) {
  const grid = createGridSampler(map, options);
  const reserved = options.reserved ?? [];
  function valid(point) {
    if (!grid.isOpen(point.x, point.y)) return false;
    if (nearestWallDistance(grid, point.x, point.y, 1.5) < (options.minWallDistance ?? 0.25)) return false;
    for (const target of reserved) if (distance2(point, target) < (target.radius ?? options.minReservedDistance ?? 1.1)) return false;
    return options.extraValidate?.(point, grid) ?? true;
  }
  return { grid, valid };
}

export function randomFreePoint(random, validator, options = {}) {
  const grid = validator.grid;
  for (let index = 0; index < (options.attempts ?? 80); index += 1) {
    const margin = options.margin ?? 1;
    const point = { x: margin + random() * Math.max(1, grid.width - margin * 2), y: margin + random() * Math.max(1, grid.height - margin * 2) };
    if (validator.valid(point)) return point;
  }
  return null;
}

export function createRaycastPlacementKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "raycast-placement-kit", version: RAYCAST_PLACEMENT_KIT_VERSION, createGridSampler, castGridRay, nearestWallDistance, createPlacementValidator, randomFreePoint };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusRealtime, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["placement:grid", "placement:raycast", "placement:validators"], bindings: { raycastPlacementKit: kit }, metadata: { version: RAYCAST_PLACEMENT_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
