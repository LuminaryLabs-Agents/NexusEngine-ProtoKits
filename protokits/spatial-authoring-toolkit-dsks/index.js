import { createGenericProtoKit } from '../generic-kit-utils/index.js';

export const SPATIAL_AUTHORING_TOOLKIT_DSK_VERSION = '0.1.0';

const NOTE_COLORS = Object.freeze([
  { id: 'yellow', hex: '#ffd84d', rgba: [1.0, 0.85, 0.30, 0.95] },
  { id: 'orange', hex: '#ff8a2a', rgba: [1.0, 0.48, 0.16, 0.95] },
  { id: 'green', hex: '#55e86f', rgba: [0.32, 0.90, 0.43, 0.95] },
  { id: 'blue', hex: '#4d8cff', rgba: [0.30, 0.55, 1.0, 0.95] },
  { id: 'red', hex: '#ff3d3d', rgba: [1.0, 0.20, 0.20, 0.95] }
]);

const PARTICLE_EFFECTS = Object.freeze([
  { id: 'mist', particleColor: [0.45, 0.85, 1.0, 0.58], velocity: [0, 0.018, 0.024], spread: 0.16, lifetimeSeconds: 2.2 },
  { id: 'embers', particleColor: [1.0, 0.38, 0.10, 0.72], velocity: [0, 0.028, 0.018], spread: 0.11, lifetimeSeconds: 1.5 },
  { id: 'pollen', particleColor: [0.95, 0.92, 0.32, 0.70], velocity: [0, 0.015, 0.012], spread: 0.22, lifetimeSeconds: 2.8 },
  { id: 'violet-sparks', particleColor: [0.95, 0.25, 1.0, 0.70], velocity: [0, 0.036, 0.020], spread: 0.13, lifetimeSeconds: 1.2 }
]);

function define(id, engineKey, provides, requires, purpose, contracts = {}) {
  return Object.freeze({
    id,
    engineKey,
    category: 'spatial-authoring-toolkit-dsk',
    tier: 'atomic',
    version: SPATIAL_AUTHORING_TOOLKIT_DSK_VERSION,
    provides,
    requires,
    purpose,
    contracts
  });
}

export const NOTE_CARD_SPAWNER_DSK_DEFINITION = define(
  'note-card-spawner-dsk',
  'noteCardSpawner',
  ['note-card:spawner', 'note-card:attached', 'note-card:color-cycle'],
  ['scene:graph', 'selection:state', 'transform:commands', 'widget:factory', 'interaction:commands'],
  'Defines the note-card spawner object, attached-card lifecycle, five-color grip cycling, and trigger-to-place behavior.',
  { colors: NOTE_COLORS.map((color) => color.id), controls: { trigger: 'spawn/place selected note card', grip: 'cycle color while card is attached; grab/move otherwise' } }
);

export const PARTICLE_FUNNEL_SPAWNER_DSK_DEFINITION = define(
  'particle-funnel-spawner-dsk',
  'particleFunnelSpawner',
  ['particle-funnel:spawner', 'particle-funnel:effect-cycle', 'particle-funnel:emitter-descriptor'],
  ['scene:graph', 'transform:commands', 'interaction:commands', 'particle:background'],
  'Defines a movable funnel/cone emitter whose trigger interaction cycles particle effects and emits from a persistent cone descriptor.',
  { effects: PARTICLE_EFFECTS.map((effect) => effect.id), emitterShape: 'cone/funnel' }
);

export const PORTAL_TRANSITION_DSK_DEFINITION = define(
  'portal-transition-dsk',
  'portalTransition',
  ['portal:spawner', 'portal:transition', 'environment:mode-switch'],
  ['scene:graph', 'interaction:commands', 'scene:recipe', 'zone:field'],
  'Defines a movable portal object that switches the active environment from mixed-reality authoring to opaque immersive meadow VR.',
  { transition: { from: 'mixed-reality-authoring', to: 'meadow-immersive-vr' } }
);

export const MEADOW_SCENE_RECIPE_DSK_DEFINITION = define(
  'meadow-scene-recipe-dsk',
  'meadowSceneRecipe',
  ['meadow:recipe', 'environment:biome', 'environment:vegetation', 'environment:lighting', 'environment:fog'],
  ['scene:recipe', 'biome:field', 'vegetation:archetype', 'scatter:object', 'vegetation:lod', 'billboard:prop', 'depth:fog', 'lighting:mood', 'surface:material', 'ground:contact'],
  'Composes existing environment/rendering DSKs into a meadow scene recipe for the portal destination.',
  { biome: 'temperate-meadow', mode: 'opaque-immersive-vr' }
);

export const SPATIAL_AUTHORING_TOOLKIT_DSK_DEFINITIONS = Object.freeze([
  NOTE_CARD_SPAWNER_DSK_DEFINITION,
  PARTICLE_FUNNEL_SPAWNER_DSK_DEFINITION,
  PORTAL_TRANSITION_DSK_DEFINITION,
  MEADOW_SCENE_RECIPE_DSK_DEFINITION
]);

export const SPATIAL_AUTHORING_TOOLKIT_CONTRACT = Object.freeze({
  inputSemantics: {
    trigger: ['note-card.spawnAttached', 'note-card.placeAttached', 'particle-funnel.cycleEffect', 'portal.enter'],
    grip: ['transform.grabMove', 'note-card.cycleColorWhenAttached']
  },
  noteCard: {
    colors: NOTE_COLORS,
    attachedState: ['none', 'attached-to-right-controller', 'placed']
  },
  particleFunnel: {
    effects: PARTICLE_EFFECTS,
    emitter: {
      shape: 'cone',
      anchor: 'object-local',
      persistent: true,
      outputDescriptor: 'particle-funnel.emitter.v1'
    }
  },
  portal: {
    touchOrTriggerEvent: 'portal.enter',
    activeEnvironmentField: 'environment.mode',
    targetRecipe: 'meadow-scene-recipe-dsk'
  },
  meadow: {
    mode: 'opaque-immersive-vr',
    requiredDSKs: [
      'scene-recipe-kit',
      'biome-field-kit',
      'vegetation-archetype-kit',
      'scatter-object-kit',
      'vegetation-lod-kit',
      'billboard-prop-kit',
      'depth-fog-kit',
      'lighting-mood-kit',
      'surface-material-kit',
      'ground-contact-kit'
    ]
  }
});

export function createSpatialAuthoringToolkitManifest(config = {}) {
  const authoringMode = config.authoringMode ?? 'mixed-reality-authoring';
  const meadowMode = config.meadowMode ?? 'meadow-immersive-vr';
  return {
    type: 'spatial-authoring-toolkit.manifest.v1',
    version: SPATIAL_AUTHORING_TOOLKIT_DSK_VERSION,
    environment: {
      activeMode: authoringMode,
      supportedModes: [authoringMode, meadowMode],
      passthrough: {
        requested: true,
        fallback: 'opaque-authoring-room',
        hostResponsibility: 'OpenXR host chooses alpha blend/vendor passthrough when available.'
      }
    },
    controls: {
      rightController: {
        trigger: 'activate selected object behavior: note spawn/place, particle effect cycle, portal enter',
        grip: 'grab/move selected object or cycle attached note color'
      }
    },
    objects: [
      createNoteCardSpawnerDescriptor(config.noteCardSpawner),
      createParticleFunnelSpawnerDescriptor(config.particleFunnelSpawner),
      createPortalDescriptor(config.portal)
    ],
    recipes: {
      meadow: createMeadowSceneRecipe(config.meadow)
    }
  };
}

export function createNoteCardSpawnerDescriptor(config = {}) {
  return {
    id: config.id ?? 'note-card-spawner',
    type: 'spatial-tool.note-card-spawner',
    dsk: NOTE_CARD_SPAWNER_DSK_DEFINITION.id,
    transform: config.transform ?? { space: 'local-floor', position: { x: -0.72, y: 1.2, z: -2.0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 0.46, y: 0.34, z: 0.04 } },
    noteCardPrototype: {
      type: 'widget.note-card',
      size: { x: 0.42, y: 0.28, z: 0.025 },
      colorCycle: NOTE_COLORS,
      defaultColorIndex: 0,
      attachment: { anchor: 'right-controller', release: 'trigger' }
    },
    interactions: {
      trigger: 'note-card.spawnOrPlace',
      gripWhileAttached: 'note-card.cycleColor',
      gripWhileDetached: 'transform.grabMove'
    }
  };
}

export function createParticleFunnelSpawnerDescriptor(config = {}) {
  return {
    id: config.id ?? 'particle-funnel-spawner',
    type: 'spatial-tool.particle-funnel-spawner',
    dsk: PARTICLE_FUNNEL_SPAWNER_DSK_DEFINITION.id,
    transform: config.transform ?? { space: 'local-floor', position: { x: 0, y: 1.2, z: -2.0 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 0.46, y: 0.34, z: 0.04 } },
    emitter: {
      type: 'particle-funnel.emitter.v1',
      shape: 'cone',
      localOrigin: { x: 0, y: -0.18, z: -0.02 },
      localDirection: { x: 0, y: 0.6, z: 1 },
      radius: 0.16,
      persistent: true,
      effects: PARTICLE_EFFECTS,
      currentEffectIndex: config.currentEffectIndex ?? 0
    },
    interactions: {
      trigger: 'particle-funnel.cycleEffect',
      grip: 'transform.grabMove'
    }
  };
}

export function createPortalDescriptor(config = {}) {
  return {
    id: config.id ?? 'meadow-portal',
    type: 'spatial-tool.portal',
    dsk: PORTAL_TRANSITION_DSK_DEFINITION.id,
    transform: config.transform ?? { space: 'local-floor', position: { x: 0.72, y: 1.2, z: -2.05 }, rotation: { x: 0, y: 0, z: 0, w: 1 }, scale: { x: 0.42, y: 0.68, z: 0.04 } },
    transition: {
      event: 'portal.enter',
      fromMode: 'mixed-reality-authoring',
      toMode: 'meadow-immersive-vr',
      targetRecipe: 'meadow',
      compositorMode: 'opaque-vr'
    },
    interactions: {
      trigger: 'portal.enter',
      touch: 'portal.enter',
      grip: 'transform.grabMove'
    }
  };
}

export function createMeadowSceneRecipe(config = {}) {
  return {
    id: config.id ?? 'meadow',
    type: 'scene.recipe.meadow.v1',
    dsk: MEADOW_SCENE_RECIPE_DSK_DEFINITION.id,
    mode: 'opaque-immersive-vr',
    biome: {
      dsk: 'biome-field-kit',
      kind: 'temperate-meadow',
      ground: { material: 'soft-grass', color: '#4f9b45' },
      wind: { speed: 0.35, variation: 0.2 }
    },
    vegetation: {
      archetypeDsk: 'vegetation-archetype-kit',
      scatterDsk: 'scatter-object-kit',
      lodDsk: 'vegetation-lod-kit',
      billboards: [
        { id: 'grass-clump', density: 0.72, height: [0.08, 0.32] },
        { id: 'white-flower', density: 0.08, height: [0.05, 0.16] },
        { id: 'yellow-flower', density: 0.06, height: [0.05, 0.18] }
      ]
    },
    lighting: {
      dsk: 'lighting-mood-kit',
      mood: 'warm-clear-afternoon',
      skyColor: '#9fd4ff',
      sunDirection: { x: -0.4, y: 0.8, z: -0.2 }
    },
    fog: {
      dsk: 'depth-fog-kit',
      color: '#c9ecff',
      density: 0.018,
      start: 12,
      end: 36
    },
    navigation: {
      dsk: 'ground-contact-kit',
      locomotion: 'right-stick-smooth-or-head-guided-fallback',
      comfort: { snapTurn: false, maxSpeedMetersPerSecond: 1.4 }
    }
  };
}

function make(def, NexusEngine, config = {}) {
  return createGenericProtoKit(NexusEngine, def, { ...config, contracts: { ...(def.contracts ?? {}), ...(config.contracts ?? {}) } });
}

export function createNoteCardSpawnerDsk(NexusEngine, config = {}) { return make(NOTE_CARD_SPAWNER_DSK_DEFINITION, NexusEngine, config); }
export function createParticleFunnelSpawnerDsk(NexusEngine, config = {}) { return make(PARTICLE_FUNNEL_SPAWNER_DSK_DEFINITION, NexusEngine, config); }
export function createPortalTransitionDsk(NexusEngine, config = {}) { return make(PORTAL_TRANSITION_DSK_DEFINITION, NexusEngine, config); }
export function createMeadowSceneRecipeDsk(NexusEngine, config = {}) { return make(MEADOW_SCENE_RECIPE_DSK_DEFINITION, NexusEngine, config); }

export function createSpatialAuthoringToolkitDsks(NexusEngine, config = {}) {
  return [
    createNoteCardSpawnerDsk(NexusEngine, config.noteCards ?? {}),
    createParticleFunnelSpawnerDsk(NexusEngine, config.particles ?? {}),
    createPortalTransitionDsk(NexusEngine, config.portal ?? {}),
    createMeadowSceneRecipeDsk(NexusEngine, config.meadow ?? {})
  ];
}

export { NOTE_COLORS, PARTICLE_EFFECTS };
export default createSpatialAuthoringToolkitDsks;
