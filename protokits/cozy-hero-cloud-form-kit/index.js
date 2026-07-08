export const COZY_HERO_CLOUD_FORM_VERSION = "0.1.0";

export function createCozyHeroCloudFormDescriptor(options = {}) {
  return {
    id: options.id || "cozy-hero-cloud-main",
    type: "cozy-hero-cloud-form",
    version: COZY_HERO_CLOUD_FORM_VERSION,
    parentDomain: "mattatz-cloud-core-kit",
    silhouette: {
      profile: "simple-puff-cluster",
      lobeCount: Number(options.lobeCount || 7),
      compactness: Number(options.compactness || 0.82),
      baseFlattening: Number(options.baseFlattening || 0.34),
      crownLift: Number(options.crownLift || 0.42)
    },
    pointCloud: {
      pointCount: Number(options.pointCount || 420),
      pointSizeMin: Number(options.pointSizeMin || 70),
      pointSizeMax: Number(options.pointSizeMax || 140),
      opacity: Number(options.opacity || 0.62),
      softness: Number(options.softness || 0.92)
    },
    placement: {
      band: options.band || "low-hero",
      position: options.position || { x: 0, y: 130, z: -24 },
      scale: options.scale || { x: 360, y: 120, z: 260 },
      aboveIsland: true,
      blocksCameraCorridor: false
    },
    lighting: {
      color: options.color || { r: 1, g: 0.98, b: 0.9 },
      undersideColor: options.undersideColor || { r: 0.78, g: 0.82, b: 0.84 },
      silverLining: Number(options.silverLining || 0.22)
    },
    drift: options.drift || { x: 0.32, z: 0.05 },
    driftSpeed: Number(options.driftSpeed || 0.012),
    rendererBoundary: { ownsRendererObjects: false, adapterRequired: true, preferredAdapter: "cached-point-cloud-puff" }
  };
}

export function createCozyHeroCloudLayerDescriptor(options = {}) {
  const cloud = createCozyHeroCloudFormDescriptor(options.cloud || options);
  return {
    id: options.id || "cozy-hero-cloud-layer",
    type: "cozy-hero-cloud-layer",
    parentDomain: "mattatz-cloud-layer-kit",
    cloudCount: 1,
    family: "single-cumulus-puff",
    clouds: [cloud],
    placementRule: "above-island-not-between-camera-and-island",
    rendererBoundary: cloud.rendererBoundary
  };
}

export function createCozyHeroCloudRenderContract(options = {}) {
  const layer = createCozyHeroCloudLayerDescriptor(options);
  return {
    id: options.id || "cozy-hero-cloud-render-contract",
    type: "cozy-hero-cloud-render-contract",
    version: COZY_HERO_CLOUD_FORM_VERSION,
    layers: [layer],
    clouds: layer.clouds,
    horizonBand: null,
    rendererBoundary: { ownsRendererObjects: false, adapterRequired: true, preferredNearAdapter: "cached-point-cloud-puff" }
  };
}
