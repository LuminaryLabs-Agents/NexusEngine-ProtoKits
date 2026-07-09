import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const ENVIRONMENT_DOMAIN_VERSION = "0.1.0";

const arr = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const copy = (value) => JSON.parse(JSON.stringify(value ?? null));
const camel = (id) => id.replace(/-kit$/, "").replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());

export const ENVIRONMENT_KIT_SPECS = Object.freeze([
  ["environment-mode-kit", "mode", "mode", "Composes terrain, vegetation, sky, weather, effects, audio, and postprocess kits into an environment stack", [], ["mode:environment", "domain:environment"]],
  ["terrain-field-kit", "terrain", "domain-service", "Seeded terrain height field, normals, slope, masks, and world bounds service", [], ["terrain:field", "terrain:height-sampler"]],
  ["terrain-sampler-kit", "terrain", "domain-service", "Terrain sample API for height, normal, slope, material, biome, and placement queries", ["terrain:field"], ["terrain:sampler"]],
  ["terrain-material-kit", "terrain", "domain-service", "Terrain material blend descriptors for grass, soil, rock, path, snow, and wetness", ["terrain:sampler"], ["terrain:materials"]],
  ["terrain-lod-kit", "terrain", "domain-service", "Terrain LOD ring, tessellation, and simplification policy descriptors", ["terrain:field"], ["terrain:lod"]],
  ["terrain-streaming-system-kit", "terrain", "system", "Hot-loop terrain chunk streaming and preload budget descriptors", ["terrain:field"], ["system:terrain-streaming"]],
  ["terrain-render-descriptor-kit", "terrain", "render", "Renderer-agnostic terrain mesh, material, and chunk descriptors", ["terrain:materials", "terrain:lod"], ["render:terrain-descriptors"]],
  ["biome-field-kit", "vegetation", "domain-service", "Biome identity, weights, material overrides, and placement rules for environment instances", [], ["biome:field"]],
  ["vegetation-archetype-kit", "vegetation", "content", "Species/archetype descriptors for grass, flowers, shrubs, trees, crops, and reeds", ["biome:field"], ["vegetation:archetypes"]],
  ["vegetation-placement-kit", "vegetation", "domain-service", "Seeded placement service for grass clumps, flowers, shrubs, trees, and set dressing", ["terrain:sampler", "vegetation:archetypes"], ["vegetation:placement"]],
  ["ground-contact-kit", "vegetation", "domain-service", "Terrain seating, normal alignment, inset placement, and slope filtering descriptors", ["terrain:sampler"], ["placement:ground-contact"]],
  ["vegetation-lod-kit", "vegetation", "domain-service", "Near/mid/far/cull LOD and billboard policy descriptors for vegetation", ["vegetation:placement"], ["vegetation:lod"]],
  ["wind-response-kit", "vegetation", "domain-service", "Wind response descriptors for grass sway, leaves, fur, cloth, smoke, and particles", ["weather:wind-field"], ["vegetation:wind-response", "secondary:wind-response"]],
  ["vegetation-render-descriptor-kit", "vegetation", "render", "Renderer-agnostic instance, billboard, mesh, material, and animation descriptors for vegetation", ["vegetation:placement", "vegetation:lod"], ["render:vegetation-descriptors"]],
  ["skybox-kit", "sky-lighting", "domain-service", "Skybox color, gradient, texture, horizon, and camera-locked descriptor service", [], ["sky:skybox"]],
  ["sun-moon-cycle-kit", "sky-lighting", "domain-service", "Sun/moon orbit, phase, color, intensity, and shadow descriptor service", ["time:day-night"], ["lighting:sun-moon-cycle"]],
  ["time-of-day-kit", "sky-lighting", "domain-service", "Day-night cycle state, normalized time, named phases, and duration descriptors", [], ["time:day-night"]],
  ["cloud-layer-kit", "sky-lighting", "domain-service", "High distant cloud layers, drift, density, parallax, and skybox placement descriptors", ["weather:wind-field"], ["sky:cloud-layers"]],
  ["atmosphere-scattering-descriptor-kit", "sky-lighting", "render", "Atmosphere scattering, haze, aerial perspective, and sun glow descriptors", ["lighting:sun-moon-cycle"], ["render:atmosphere-scattering"]],
  ["lighting-policy-kit", "sky-lighting", "domain-service", "Lighting policy descriptors for ambient, key, fill, shadow, exposure, and fog coupling", ["time:day-night"], ["lighting:policy"]],
  ["weather-domain-service-kit", "weather", "domain-service", "Weather profile, transition, zone, wind, fog, precipitation, and exposure service rules", [], ["weather:domain-service"]],
  ["wind-field-kit", "weather", "domain-service", "Deterministic world wind vector field sampled by vegetation, smoke, clouds, and audio", ["weather:domain-service"], ["weather:wind-field"]],
  ["fog-field-kit", "weather", "domain-service", "Distance/height/local fog field descriptors for atmosphere, gameplay, and postprocess", ["weather:domain-service"], ["weather:fog-field"]],
  ["rain-snow-profile-kit", "weather", "domain-service", "Precipitation profile descriptors for rain, snow, sleet, wetness, and accumulation", ["weather:domain-service"], ["weather:precipitation-profile"]],
  ["weather-zone-kit", "weather", "domain-service", "Weather zone volume descriptors and enter/exit transition events", ["weather:domain-service"], ["weather:zones"]],
  ["weather-transition-kit", "weather", "domain-service", "Weather blending descriptors for strength, duration, easing, and phase changes", ["weather:domain-service"], ["weather:transitions"]],
  ["particle-field-kit", "effects", "system", "Particle field descriptors for ambient motes, dust, rain, embers, leaves, and pollen", [], ["effects:particle-field"]],
  ["smoke-column-kit", "effects", "domain-service", "Smoke column simulation descriptors for wind drift, rise, curl, fade, and density", ["weather:wind-field"], ["effects:smoke-column"]],
  ["chimney-smoke-kit", "effects", "domain-service", "Chimney smoke emitter descriptors tied to structure sockets and wind field samples", ["effects:smoke-column"], ["effects:chimney-smoke"]],
  ["pollen-dust-kit", "effects", "domain-service", "Pollen and dust ambient particle descriptors driven by vegetation, weather, and light", ["effects:particle-field"], ["effects:pollen-dust"]],
  ["ambient-vfx-kit", "effects", "domain-service", "Ambient visual event descriptors for glints, fireflies, falling leaves, and soft motes", ["effects:particle-field"], ["effects:ambient-vfx"]],
  ["ambient-audio-kit", "audio", "domain-service", "Ambient audio layer state for wind, insects, birds, foliage, water, and distant environment loops", [], ["audio:ambient-state"]],
  ["procedural-music-state-kit", "audio", "domain-service", "Long-form procedural music state descriptors for mood, density, motifs, and duration", ["time:day-night"], ["audio:procedural-music-state"]],
  ["wind-audio-kit", "audio", "domain-service", "Wind audio layer descriptors linked to wind strength, gusts, foliage, and camera exposure", ["weather:wind-field"], ["audio:wind"]],
  ["wildlife-audio-kit", "audio", "domain-service", "Wildlife audio event and ambience descriptors for birds, insects, livestock, and distance calls", ["time:day-night"], ["audio:wildlife"]],
  ["time-of-day-audio-kit", "audio", "domain-service", "Audio mix transitions for dawn, day, dusk, night, and weather phases", ["time:day-night"], ["audio:time-of-day"]],
  ["color-grade-kit", "postprocess", "render", "Color grade descriptors for biome, time of day, mood, exposure, and cinematic tone", ["time:day-night"], ["postprocess:color-grade"]],
  ["bloom-policy-kit", "postprocess", "render", "Bloom threshold, radius, intensity, and source policy descriptors", ["lighting:policy"], ["postprocess:bloom-policy"]],
  ["depth-of-field-policy-kit", "postprocess", "render", "Depth-of-field focus distance, aperture, cinematic focus, and quality descriptors", ["camera:rig"], ["postprocess:depth-of-field-policy"]],
  ["fog-postprocess-kit", "postprocess", "render", "Postprocess fog, aerial perspective, and atmospheric blend descriptors", ["weather:fog-field"], ["postprocess:fog"]],
  ["render-quality-profile-kit", "postprocess", "render", "Render quality profile descriptors for resolution, effects budget, LOD, particles, and postprocess", [], ["render:quality-profile"]]
]);

export const ENVIRONMENT_DOMAIN_MANIFEST = Object.freeze({
  id: "environment-domain",
  version: ENVIRONMENT_DOMAIN_VERSION,
  purpose: "Reusable high-fidelity environment DSKs for terrain, vegetation, sky/lighting, weather, effects, audio, and postprocess.",
  subdomains: Object.freeze(["mode", "terrain", "vegetation", "sky-lighting", "weather", "effects", "audio", "postprocess"]),
  excludes: Object.freeze(["fluid-domain", "water-subdomain"]),
  kits: Object.freeze(ENVIRONMENT_KIT_SPECS.map(([id]) => id))
});

export function createEnvironmentKitById(NexusEngine, kitId, config = {}) {
  const spec = ENVIRONMENT_KIT_SPECS.find(([id]) => id === kitId);
  if (!spec) throw new Error(`Unknown environment kit: ${kitId}`);
  const [id, subdomain, category, purpose, requires, provides] = spec;
  const state = { descriptors: arr(config.descriptors), presets: arr(config.presets), config: copy(config.config ?? {}) };
  const apiName = config.apiName ?? camel(id);
  const api = Object.freeze({
    id: config.id ?? id,
    version: ENVIRONMENT_DOMAIN_VERSION,
    domain: "environment-domain",
    subdomain,
    category,
    purpose,
    requires: arr(config.requires ?? requires),
    provides: arr(config.provides ?? provides),
    describe() { return Object.freeze({ id: api.id, version: api.version, domain: api.domain, subdomain, category, purpose, requires: api.requires.slice(), provides: api.provides.slice() }); },
    getState() { return copy(state); },
    createRuntimeKit(options = {}) {
      return defineInjectedRuntimeKit(NexusEngine, {
        id: options.id ?? api.id,
        requires: options.requires ?? api.requires,
        provides: options.provides ?? api.provides,
        bindings: { [apiName]: api },
        metadata: { version: api.version, domain: api.domain, subdomain, category, purpose, rendererIndependent: true, headlessSafe: true, ...(options.metadata ?? {}) }
      });
    }
  });
  return api;
}

export function createEnvironmentDomainKits(NexusEngine, config = {}) {
  const omit = new Set(arr(config.omit));
  return ENVIRONMENT_KIT_SPECS.filter(([id]) => !omit.has(id)).map(([id]) => createEnvironmentKitById(NexusEngine, id, config[id] ?? {}));
}

export default createEnvironmentDomainKits;
