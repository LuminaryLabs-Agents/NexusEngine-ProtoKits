import { asList, byId, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const MATERIAL_PALETTE_KIT_VERSION = "0.1.0";

export const DEFAULT_MATERIALS = Object.freeze([
  { id: "terrain.grass", role: "terrain", albedo: "#2f6b39", roughness: 0.92, metalness: 0, receiveShadow: true },
  { id: "terrain.rock", role: "terrain", albedo: "#68706b", roughness: 0.86, metalness: 0, receiveShadow: true },
  { id: "tree.bark", role: "static", albedo: "#4b2c17", roughness: 0.9, metalness: 0 },
  { id: "tree.foliage", role: "static", albedo: "#165b2b", roughness: 0.82, translucency: 0.12 },
  { id: "cloud.soft", role: "transparent", albedo: "#ffffff", alpha: 0.42, roughness: 1 },
  { id: "actor.body", role: "character", albedo: "#f8fafc", roughness: 0.7 },
  { id: "fx.wind", role: "emissive", albedo: "#7dd3fc", emissive: "#7dd3fc", alpha: 0.66, bloom: 0.28 }
]);

export function normalizeMaterial(material = {}, index = 0) {
  return {
    id: material.id ?? `material-${index + 1}`,
    role: material.role ?? "static",
    albedo: material.albedo ?? material.color ?? "#ffffff",
    roughness: material.roughness ?? 0.8,
    metalness: material.metalness ?? 0,
    alpha: material.alpha ?? 1,
    emissive: material.emissive ?? null,
    bloom: material.bloom ?? 0,
    tags: asList(material.tags),
    renderer: material.renderer ?? {},
    ...material
  };
}

export function createMaterialPaletteState(options = {}) {
  const materials = [...DEFAULT_MATERIALS, ...asList(options.materials)].map(normalizeMaterial);
  return { version: MATERIAL_PALETTE_KIT_VERSION, activeTheme: options.theme ?? "default", materials: byId(materials), aliases: { ...(options.aliases ?? {}) } };
}

export function createMaterialPaletteKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const MaterialPaletteState = resource(options.resourceName ?? "materialPalette.state");
  const MaterialRegistered = event("materialPalette.registered");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "material-palette-kit",
    resources: { MaterialPaletteState },
    events: { MaterialRegistered },
    provides: ["material-palette", "material-descriptors"],
    initWorld({ world }) { ensureResource(world, MaterialPaletteState, () => createMaterialPaletteState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, MaterialPaletteState, () => createMaterialPaletteState(options));
      engine.materialPalette = {
        getState: state,
        get(id, fallback = null) {
          const key = state().aliases[id] ?? id;
          return clone(state().materials[key] ?? fallback);
        },
        register(material) {
          const next = state();
          const normalized = normalizeMaterial(material, Object.keys(next.materials).length);
          next.materials[normalized.id] = normalized;
          world.setResource(MaterialPaletteState, next);
          world.emit(MaterialRegistered, { material: clone(normalized) });
          return normalized;
        },
        listByRole(role) { return Object.values(state().materials).filter((material) => !role || material.role === role).map(clone); },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: MATERIAL_PALETTE_KIT_VERSION, purpose: "Renderer-agnostic material descriptors for terrain, scatter, actors, sky, and effects." }
  });
}
