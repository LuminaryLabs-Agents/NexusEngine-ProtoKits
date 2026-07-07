export const STONEWAKE_VISUAL_STYLE_COMPOSITION_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

export const STONEWAKE_STYLE_KIT_PRESETS = Object.freeze([
  ["stone-surface-texture-kit", "surface", "stone-grain", "Base stone grain, uneven fills, chipped platform faces."],
  ["wet-stone-texture-kit", "surface", "wet-stone", "Glossy dark patches near water and leaks."],
  ["ancient-crack-texture-kit", "surface", "cracks", "Procedural cracks on slabs, blocks, walls, and doors."],
  ["moss-edge-texture-kit", "surface", "moss-edge", "Moss and lichen on old upper edges."],
  ["mineral-vein-texture-kit", "surface", "mineral-vein", "Faint cyan-white mineral streaks in cave rock."],
  ["eroded-edge-texture-kit", "surface", "eroded-edge", "Rounded and chipped silhouettes."],
  ["sediment-layer-texture-kit", "surface", "sediment-lines", "Horizontal cave strata and water-worn bands."],
  ["rubble-noise-texture-kit", "surface", "rubble-noise", "Small pebble clusters and broken stone detail."],
  ["carved-rune-texture-kit", "surface", "carved-runes", "Carved machine runes on gates and plates."],
  ["aged-metal-texture-kit", "surface", "aged-metal", "Rust, scratches, oxidation for valves and chains."],
  ["lantern-light-style-kit", "lighting", "lantern", "Warm player safety light, cone, falloff, flicker."],
  ["torch-flicker-style-kit", "lighting", "torch-flicker", "Torch glow and wall pulse."],
  ["cyan-rune-light-style-kit", "lighting", "cyan-rune", "Cold blue machine glow."],
  ["door-goal-glow-style-kit", "lighting", "door-goal", "Long-distance goal readability."],
  ["pressure-plate-glow-style-kit", "lighting", "plate-glow", "Plate state without HUD dependency."],
  ["valve-proximity-glow-style-kit", "lighting", "valve-proximity", "Valve interaction visibility."],
  ["creature-alert-light-style-kit", "lighting", "creature-alert", "Creature state color and pulse."],
  ["water-reflection-light-kit", "lighting", "water-reflection", "Waterline shimmer reflected into cave."],
  ["cave-depth-vignette-kit", "lighting", "depth-vignette", "Dark edge framing while preserving route clarity."],
  ["foreground-shadow-style-kit", "lighting", "foreground-shadow", "Moving silhouettes and lantern-driven shadows."],
  ["stone-dust-style-kit", "particles", "stone-dust", "Dust on landing, push, rumble."],
  ["scrape-spark-style-kit", "particles", "scrape-sparks", "Sparks from heavy stone movement."],
  ["impact-chip-style-kit", "particles", "impact-chips", "Stone chips on impact."],
  ["water-splash-style-kit", "particles", "water-splash", "Splash bursts on water contact."],
  ["bubble-column-style-kit", "particles", "bubble-column", "Bubbles rising below waterline."],
  ["water-mist-style-kit", "particles", "water-mist", "Mist above blackwater."],
  ["foam-line-style-kit", "particles", "foam-line", "Foam and shimmer along water surface."],
  ["rune-spark-style-kit", "particles", "rune-spark", "Cyan sparks from active runes."],
  ["door-awakening-style-kit", "particles", "door-awakening", "Large gate-opening particle storm."],
  ["sound-wave-particle-style-kit", "particles", "sound-wave", "Broken acoustic wave particles."],
  ["platform-silhouette-style-kit", "silhouette", "platform-shape", "Less rectangular platform profiles."],
  ["cave-wall-silhouette-kit", "silhouette", "cave-wall", "Irregular cave boundary shapes."],
  ["foreground-stalactite-kit", "silhouette", "stalactites", "Foreground cave spikes and hanging stone."],
  ["background-pillar-style-kit", "silhouette", "pillars", "Large dark parallax cave pillars."],
  ["machine-silhouette-style-kit", "silhouette", "machine", "Wheels, pipes, counterweights behind route."],
  ["door-monolith-style-kit", "silhouette", "door-monolith", "Heavy iconic gate profile."],
  ["chain-silhouette-style-kit", "silhouette", "chain", "Readable climb chain shape and links."],
  ["creature-silhouette-style-kit", "silhouette", "creature", "Low blind cave predator silhouette."],
  ["player-silhouette-style-kit", "silhouette", "player", "Cloak, hood, backpack, lantern posture."],
  ["block-silhouette-style-kit", "silhouette", "block", "Push block distinct from platforms."],
  ["ancient-sluice-theme-kit", "theme", "sluice", "Pipes, water stains, bronze/cyan machine language."],
  ["blackwater-theme-kit", "theme", "blackwater", "Dark oily dangerous water treatment."],
  ["forgotten-temple-theme-kit", "theme", "temple", "Old carved slabs, runes, broken arches."],
  ["subterranean-survival-theme-kit", "theme", "survival", "Moisture, grit, darkness, danger tone."],
  ["acoustic-stealth-theme-kit", "theme", "acoustic", "Sound visuals and creature reactions."],
  ["physical-puzzle-theme-kit", "theme", "physical-puzzle", "Visual links between block, plate, valve, door."],
  ["blue-machine-magic-theme-kit", "theme", "blue-machine", "Cyan energy for active mechanisms."],
  ["warm-vs-cold-light-theme-kit", "theme", "warm-cold", "Warm player safety vs cold machine danger."],
  ["reactive-world-theme-kit", "theme", "reactive-world", "State changes produce visible world response."],
  ["steam-polish-style-composition-kit", "composition", "steam-polish", "Aggregator over texture, lighting, particles, silhouettes, and theme." ]
].map(([id, layer, token, purpose], order) => ({ id, layer, token, purpose, order, enabled: true })));

function requireNexus(NexusRealtime, factoryName) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`${factoryName} requires NexusRealtime.${key}.`);
  }
}

function ensureNamespace(engine, namespace) {
  if (!engine || typeof engine !== "object") return null;
  if (!engine.n || typeof engine.n !== "object") engine.n = {};
  if (!engine.n[namespace] || typeof engine.n[namespace] !== "object") engine.n[namespace] = {};
  return engine.n[namespace];
}

export function buildStonewakeStyleComposition(options = {}) {
  const enabled = new Set(options.enabled ?? STONEWAKE_STYLE_KIT_PRESETS.map((preset) => preset.id));
  const intensity = Number.isFinite(Number(options.intensity)) ? Number(options.intensity) : 1;
  const descriptors = STONEWAKE_STYLE_KIT_PRESETS.filter((preset) => enabled.has(preset.id)).map((preset) => ({
    ...preset,
    intensity,
    drawHints: {
      textureDensity: preset.layer === "surface" ? intensity : 0,
      glowDensity: preset.layer === "lighting" ? intensity : 0,
      particleDensity: preset.layer === "particles" ? intensity : 0,
      shapeNoise: preset.layer === "silhouette" ? intensity : 0,
      themeWeight: preset.layer === "theme" || preset.layer === "composition" ? intensity : 0
    }
  }));
  return {
    version: STONEWAKE_VISUAL_STYLE_COMPOSITION_KIT_VERSION,
    id: options.id ?? "stonewake-visual-style-composition",
    descriptors,
    layers: {
      surface: descriptors.filter((descriptor) => descriptor.layer === "surface"),
      lighting: descriptors.filter((descriptor) => descriptor.layer === "lighting"),
      particles: descriptors.filter((descriptor) => descriptor.layer === "particles"),
      silhouette: descriptors.filter((descriptor) => descriptor.layer === "silhouette"),
      theme: descriptors.filter((descriptor) => descriptor.layer === "theme" || descriptor.layer === "composition")
    },
    palette: {
      stoneBase: "#172130",
      stoneDark: "#0b111a",
      wetStone: "#0b1820",
      cyan: "#57ddff",
      rune: "#8af4ff",
      warm: "#ffd166",
      blackwater: "#041321",
      danger: "#ff4f5f",
      moss: "#405b3f",
      mineral: "#9ff5ff"
    }
  };
}

export function createStonewakeVisualStyleCompositionKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime, "createStonewakeVisualStyleCompositionKit");
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const VisualStyleState = defineResource(config.resourceName ?? "stonewakeVisualStyle.state");
  const VisualStyleComposed = defineEvent("stonewakeVisualStyle.composed");
  const initial = () => buildStonewakeStyleComposition(config.defaultComposition ?? {});
  return defineRuntimeKit({
    id: config.kitId ?? "stonewake-visual-style-composition-kit",
    provides: ["style:visual-composition", "style:texture-descriptors", "style:theme-descriptors"],
    resources: { VisualStyleState },
    events: { VisualStyleComposed },
    systems: [],
    initWorld({ world }) { world.setResource(VisualStyleState, initial()); },
    install({ engine, world }) {
      const api = {
        resources: { VisualStyleState },
        events: { VisualStyleComposed },
        compose(options = {}) {
          const composition = buildStonewakeStyleComposition(options);
          world.setResource(VisualStyleState, composition);
          world.emit?.(VisualStyleComposed, { id: composition.id, descriptorCount: composition.descriptors.length });
          return clone(composition);
        },
        getState() { return clone(world.getResource(VisualStyleState) ?? initial()); },
        getDescriptors() { return this.getState().descriptors; },
        listPresets() { return clone(STONEWAKE_STYLE_KIT_PRESETS); }
      };
      engine.stonewakeVisualStyle = api;
      Object.assign(ensureNamespace(engine, "stonewakeVisualStyle") ?? {}, api);
    },
    metadata: {
      version: STONEWAKE_VISUAL_STYLE_COMPOSITION_KIT_VERSION,
      domain: "visual-style-composition",
      layer: "renderer-domain",
      extendsBase: "DomainServiceKit",
      ownsLoop: false,
      boundary: "Owns visual style descriptors, texture layers, lighting layers, particle style layers, silhouette layers, and theme composition. It does not own gameplay truth, input, physics, audio, or renderer draw calls."
    }
  });
}

export default createStonewakeVisualStyleCompositionKit;
