import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const SURFACE_MATERIAL_KIT_VERSION = "0.0.1";

export const defaultSurfaceLegend = Object.freeze({
  wall: { wall: "scratchedMetal", floor: "concrete", solid: true },
  open: { floor: "dirt", wall: "rust", solid: false },
  pad: { floor: "concrete", decal: "pad", solid: false },
  gate: { floor: "hazardPaint", wall: "rust", solid: true },
  oil: { floor: "oil", solid: false },
  metal: { floor: "scratchedMetal", solid: false }
});

export function createSurfaceMaterialMap(map, options = {}) {
  const byTile = { "#": "wall", ".": "open", g: "pad", G: "gate", "~": "oil", "=": "metal", ...(options.tileAliases ?? {}) };
  const legend = { ...defaultSurfaceLegend, ...(options.legend ?? {}) };
  const fallback = options.defaultSurface ?? { floor: "dirt", wall: "rust", solid: false };
  const rows = Array.isArray(map) ? map.map(String) : [];
  function tile(x, y) { return rows[Math.floor(y)]?.[Math.floor(x)] ?? options.outOfBoundsTile ?? "#"; }
  function surfaceForTile(value) { return { ...fallback, ...(legend[byTile[value] ?? value] ?? {}) }; }
  function sample(x, y) { return surfaceForTile(tile(x, y)); }
  return { rows, legend, tile, surfaceForTile, sample };
}

export function blendSurfaceRules(baseLegend = {}, rules = []) {
  const legend = { ...baseLegend };
  for (const rule of rules) for (const key of rule.keys ?? []) legend[key] = { ...(legend[key] ?? {}), ...(rule.surface ?? {}) };
  return legend;
}

export function createSurfaceMaterialKit(nexusRealtime = {}, options = {}) {
  const kit = { id: options.id ?? "surface-material-kit", version: SURFACE_MATERIAL_KIT_VERSION, defaultSurfaceLegend, createSurfaceMaterialMap, blendSurfaceRules };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusRealtime, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["surface:materials", "surface:legend"], bindings: { surfaceMaterialKit: kit }, metadata: { version: SURFACE_MATERIAL_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
