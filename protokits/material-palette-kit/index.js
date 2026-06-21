import { asList, byId, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const MATERIAL_PALETTE_KIT_VERSION = "0.2.0";

export const DEFAULT_MATERIALS = Object.freeze([
  { id: "terrain.grass", family: "terrain", role: "terrain", albedo: "#2f6b39", roughness: 0.92, metalness: 0, receiveShadow: true },
  { id: "terrain.rock", family: "stone", role: "terrain", albedo: "#68706b", roughness: 0.86, metalness: 0, receiveShadow: true },
  { id: "tree.bark", family: "wood", role: "static", albedo: "#4b2c17", roughness: 0.9, metalness: 0 },
  { id: "tree.foliage", family: "foliage", role: "static", albedo: "#165b2b", roughness: 0.82, translucency: 0.12 },
  { id: "cloud.soft", family: "cloud", role: "transparent", albedo: "#ffffff", alpha: 0.42, roughness: 1 },
  { id: "actor.body", family: "actor", role: "character", albedo: "#f8fafc", roughness: 0.7 },
  { id: "fx.wind", family: "fx", role: "emissive", albedo: "#7dd3fc", emissive: "#7dd3fc", alpha: 0.66, bloom: 0.28 },
  { id: "fruit.peel.yellow", family: "fruit-skin", role: "organic", albedo: "#f6d44a", roughness: 0.78, metalness: 0, tags: ["object-proof", "fruit", "peel"] },
  { id: "fruit.peel.spotted", family: "peel", role: "organic", albedo: "#dfbf36", roughness: 0.82, overlay: "brown-speckle", tags: ["object-proof", "blemish"] },
  { id: "surface.blemish.brown", family: "blemish", role: "overlay", albedo: "#6e421e", roughness: 0.9, alpha: 0.72, tags: ["object-proof", "overlay"] },
  { id: "metal.coin.gold", family: "metal", role: "metal", albedo: "#f3c15a", roughness: 0.38, metalness: 1, tags: ["object-proof", "coin", "readability"] },
  { id: "plastic.arcade.red", family: "plastic", role: "interactive", albedo: "#d92d20", roughness: 0.42, clearcoat: 0.55, tags: ["object-proof", "button"] },
  { id: "led.arcade.white", family: "LED", role: "emissive", albedo: "#e8fbff", emissive: "#baf7ff", bloom: 0.72, tags: ["object-proof", "button", "feedback"] },
  { id: "wood.crate.dry", family: "wood", role: "static", albedo: "#7a4e2b", roughness: 0.88, normalStrength: 0.45, tags: ["object-proof", "crate"] },
  { id: "wood.crate.wet", family: "wet wood", role: "static", albedo: "#4f341f", roughness: 0.52, sheen: 0.25, tags: ["object-proof", "wet"] },
  { id: "glass.potion.clear", family: "glass", role: "transparent", albedo: "#c7f0ff", alpha: 0.32, roughness: 0.05, transmission: 0.78, ior: 1.45, tags: ["object-proof", "glass"] },
  { id: "liquid.potion.blue", family: "liquid", role: "transparent", albedo: "#2ec7ff", emissive: "#1688ff", alpha: 0.7, roughness: 0.18, bloom: 0.22, tags: ["object-proof", "liquid"] },
  { id: "paper.label.aged", family: "label paper", role: "decal", albedo: "#d8c79d", roughness: 0.84, tags: ["object-proof", "label"] },
  { id: "cloth.rope.fiber", family: "rope", role: "fiber", albedo: "#9b7b55", roughness: 0.95, normalStrength: 0.6, tags: ["object-proof", "rope"] },
  { id: "stone.chipped.gray", family: "stone", role: "static", albedo: "#777b78", roughness: 0.86, normalStrength: 0.5, tags: ["object-proof", "stone"] }
]);

export function normalizeMaterial(material = {}, index = 0) {
  return {
    id: material.id ?? `material-${index + 1}`,
    family: material.family ?? material.group ?? material.role ?? "generic",
    role: material.role ?? "static",
    albedo: material.albedo ?? material.color ?? "#ffffff",
    roughness: material.roughness ?? 0.8,
    metalness: material.metalness ?? 0,
    alpha: material.alpha ?? 1,
    emissive: material.emissive ?? null,
    bloom: material.bloom ?? 0,
    tags: asList(material.tags),
    surfaceResponse: material.surfaceResponse ?? {
      readableAtDistance: material.readableAtDistance ?? 12,
      inspectionPriority: material.inspectionPriority ?? (asList(material.tags).includes("object-proof") ? 1 : 0),
      transparencyCost: material.alpha != null && material.alpha < 1 ? 1 : 0,
      emissiveCost: material.emissive ? 1 : 0
    },
    variants: asList(material.variants),
    renderer: material.renderer ?? {},
    ...material
  };
}

export function createMaterialPaletteState(options = {}) {
  const materials = [...DEFAULT_MATERIALS, ...asList(options.materials)].map(normalizeMaterial);
  const byFamily = materials.reduce((families, material) => {
    const family = material.family ?? "generic";
    (families[family] ??= []).push(material.id);
    return families;
  }, {});
  return { version: MATERIAL_PALETTE_KIT_VERSION, activeTheme: options.theme ?? "default", materials: byId(materials), aliases: { ...(options.aliases ?? {}) }, families: byFamily };
}

export function createMaterialPaletteKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const MaterialPaletteState = resource(options.resourceName ?? "materialPalette.state");
  const MaterialRegistered = event("materialPalette.registered");
  const MaterialFamilyRegistered = event("materialPalette.familyRegistered");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? "material-palette-kit",
    resources: { MaterialPaletteState },
    events: { MaterialRegistered, MaterialFamilyRegistered },
    provides: ["material-palette", "material-descriptors", "material-variant-descriptors", "surface-response-descriptors"],
    initWorld({ world }) { ensureResource(world, MaterialPaletteState, () => createMaterialPaletteState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, MaterialPaletteState, () => createMaterialPaletteState(options));
      const publish = (next) => { world.setResource(MaterialPaletteState, next); return next; };
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
          (next.families[normalized.family] ??= []).push(normalized.id);
          next.families[normalized.family] = [...new Set(next.families[normalized.family])];
          publish(next);
          world.emit(MaterialRegistered, { material: clone(normalized) });
          return normalized;
        },
        registerFamily(family, materials = []) {
          const registered = asList(materials).map((material) => this.register({ ...material, family }));
          world.emit(MaterialFamilyRegistered, { family, materialIds: registered.map((material) => material.id) });
          return registered;
        },
        listByRole(role) { return Object.values(state().materials).filter((material) => !role || material.role === role).map(clone); },
        listByFamily(family) { return asList(state().families?.[family]).map((id) => clone(state().materials[id])).filter(Boolean); },
        listObjectProofMaterials() { return Object.values(state().materials).filter((material) => asList(material.tags).includes("object-proof")).map(clone); },
        describeSurfaceResponse(id, context = {}) {
          const material = this.get(id);
          if (!material) return null;
          return {
            materialId: material.id,
            family: material.family,
            role: material.role,
            alpha: material.alpha,
            emissive: material.emissive,
            metalness: material.metalness,
            roughness: material.roughness,
            response: { ...(material.surfaceResponse ?? {}), ...context }
          };
        },
        snapshot: () => clone(state())
      };
    },
    metadata: { version: MATERIAL_PALETTE_KIT_VERSION, purpose: "Renderer-agnostic material descriptors, variant families, and surface response descriptors for reusable object proofs." }
  });
}
