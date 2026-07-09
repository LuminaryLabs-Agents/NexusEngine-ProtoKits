import { add3, clamp, createDefinitions, createRng, dt, ensureState, forwardFromRotation, hashString, installApi, len3, makeRuntimeKit, mul3, norm3, now, num, terrainHeight, terrainNormal, writeState } from './core.js';

export const TERRAIN_STREAMER_KIT_VERSION = '0.4.0';

function stableUnit(seed) {
  return (hashString(seed) % 1000003) / 1000003;
}

function terrainQueryFromConfig(world, config = {}) {
  const terrainKit = config.terrainKit;
  const queryResource = terrainKit?.definitions?.resources?.TerrainQuery ?? terrainKit?.resources?.TerrainQuery;
  return queryResource ? world.getResource(queryResource) : null;
}

function heightAt(world, state, config, x, z) {
  return num(terrainQueryFromConfig(world, config)?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
}

function normalAt(world, state, config, x, z) {
  return terrainQueryFromConfig(world, config)?.normalAt?.(x, z) ?? terrainNormal(state.terrain, x, z);
}

function biomeFromSample(state, config, y, normal = {}, material = null) {
  if (material === 'sand' || material === 'wet-sand' || material === 'seabed') return 'shore';
  if (material === 'rock') return 'rock';
  const terrain = state.terrain ?? config;
  if (y < num(terrain.shoreline, -32)) return 'shore';
  if (y > num(terrain.timberline, 135)) return 'alpine';
  if ((1 - num(normal.y, 1)) > num(terrain.rockSlope, 0.34)) return 'rock';
  return 'forest';
}

function biomeAt(world, state, config, x, z) {
  const query = terrainQueryFromConfig(world, config);
  const material = query?.materialAt?.(x, z);
  const y = num(query?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
  const normal = query?.normalAt?.(x, z) ?? terrainNormal(state.terrain, x, z);
  return biomeFromSample(state, config, y, normal, material);
}

function materialAt(world, state, config, x, z) {
  const query = terrainQueryFromConfig(world, config);
  return query?.materialAt?.(x, z) ?? biomeAt(world, state, config, x, z);
}

function patchId(lod, px, pz) {
  return `${lod}:${px},${pz}`;
}

function patchRevisionKey(queryVersion, lod, segments, size, qualityTier) {
  return `${queryVersion}:${lod}:${segments}:${size}:${qualityTier}`;
}

function qualityTierOf(state, config = {}) {
  const tier = state.world?.qualityTier ?? config.qualityTier ?? config.quality ?? 'medium';
  return ['low', 'medium', 'high', 'adaptive'].includes(tier) ? tier : 'medium';
}

function defaultLodRings(tier = 'medium') {
  if (tier === 'low') {
    return [
      { id: 'near', radius: 1, patchSize: 1100, sampleSegments: 8, collision: true, scatterDensity: 0.000016 },
      { id: 'mid', radius: 1, patchSize: 2200, sampleSegments: 4, collision: false, scatterDensity: 0.000004 },
      { id: 'far', radius: 1, patchSize: 4400, sampleSegments: 2, collision: false, scatterDensity: 0 }
    ];
  }
  if (tier === 'high') {
    return [
      { id: 'near', radius: 2, patchSize: 800, sampleSegments: 16, collision: true, scatterDensity: 0.000034 },
      { id: 'mid', radius: 2, patchSize: 1600, sampleSegments: 8, collision: false, scatterDensity: 0.000012 },
      { id: 'far', radius: 2, patchSize: 3200, sampleSegments: 4, collision: false, scatterDensity: 0 }
    ];
  }
  return [
    { id: 'near', radius: 1, patchSize: 900, sampleSegments: 14, collision: true, scatterDensity: 0.000026 },
    { id: 'mid', radius: 2, patchSize: 1800, sampleSegments: 7, collision: false, scatterDensity: 0.000008 },
    { id: 'far', radius: 2, patchSize: 3600, sampleSegments: 3, collision: false, scatterDensity: 0 }
  ];
}

function normalizeLodRings(state, config = {}) {
  const tier = qualityTierOf(state, config);
  const explicit = Array.isArray(config.lodRings) && config.lodRings.length ? config.lodRings : defaultLodRings(tier);
  return explicit.map((ring, index) => ({
    id: ring.id ?? ['near', 'mid', 'far'][index] ?? `lod-${index}`,
    index,
    radius: Math.max(0, Math.floor(num(ring.radius, index === 0 ? 1 : 2))),
    patchSize: num(ring.patchSize ?? ring.size, num(config.patchSize, num(state.terrain.patchSize, 900 * (index + 1)))),
    sampleSegments: Math.max(2, Math.floor(num(ring.sampleSegments ?? ring.segments, Math.max(3, 14 - index * 5)))),
    collision: ring.collision ?? index === 0,
    scatterDensity: num(ring.scatterDensity, index === 0 ? num(config.scatterDensity, 0.000026) : 0),
    preloadSeconds: num(ring.preloadSeconds, num(config.preloadSeconds, 4)),
    forwardBias: num(ring.forwardBias, num(config.forwardPreloadBias, 0.65)),
    materialScale: num(ring.materialScale, index === 0 ? 1 : index === 1 ? 0.42 : 0.16)
  }));
}

function predictedPosition(state, seconds) {
  const p = state.body?.position ?? {};
  const v = state.body?.velocity ?? {};
  return {
    x: num(p.x) + num(v.x) * seconds,
    y: num(p.y) + num(v.y) * seconds,
    z: num(p.z) + num(v.z) * seconds
  };
}

function coordsForCenter(center, ring) {
  const centerX = Math.round(num(center.x) / ring.patchSize);
  const centerZ = Math.round(num(center.z) / ring.patchSize);
  const coords = [];
  for (let dz = -ring.radius; dz <= ring.radius; dz += 1) {
    for (let dx = -ring.radius; dx <= ring.radius; dx += 1) {
      coords.push({
        lod: ring.id,
        lodIndex: ring.index,
        px: centerX + dx,
        pz: centerZ + dz,
        size: ring.patchSize,
        sampleSegments: ring.sampleSegments,
        collision: Boolean(ring.collision),
        scatterDensity: ring.scatterDensity,
        materialScale: ring.materialScale,
        priority: Math.abs(dx) + Math.abs(dz) + Math.hypot(dx, dz) * 0.001,
        preload: false
      });
    }
  }
  return coords;
}

function planLodPatches(state, config) {
  const rings = normalizeLodRings(state, config);
  const position = state.body?.position ?? { x: 0, z: 0 };
  const map = new Map();
  for (const ring of rings) {
    for (const coord of coordsForCenter(position, ring)) {
      map.set(patchId(coord.lod, coord.px, coord.pz), coord);
    }
    const predicted = predictedPosition(state, ring.preloadSeconds);
    for (const coord of coordsForCenter(predicted, ring)) {
      const id = patchId(coord.lod, coord.px, coord.pz);
      const previous = map.get(id);
      const priority = coord.priority * (1 - clamp(ring.forwardBias, 0, 0.9)) + ring.index * 0.75;
      if (!previous || priority < previous.priority) {
        map.set(id, { ...coord, preload: true, priority });
      }
    }
  }
  const coords = Array.from(map.values()).sort((a, b) => a.lodIndex - b.lodIndex || a.priority - b.priority || patchId(a.lod, a.px, a.pz).localeCompare(patchId(b.lod, b.px, b.pz)));
  return { rings, coords };
}

function sampleTerrain(world, state, config, query, x, z) {
  const y = num(query?.heightAt?.(x, z), terrainHeight(state.terrain, x, z));
  const normal = query?.normalAt?.(x, z) ?? terrainNormal(state.terrain, x, z);
  const material = query?.materialAt?.(x, z) ?? null;
  const biome = biomeFromSample(state, config, y, normal, material);
  return { x, y, z, normal, biome, material: material ?? biome };
}

function createScatterForPatch(world, state, config, coord, query = terrainQueryFromConfig(world, config)) {
  const density = num(coord.scatterDensity, num(config.scatterDensity, 0.000026));
  const count = Math.max(0, Math.round(coord.size * coord.size * density));
  const items = [];
  const key = patchId(coord.lod, coord.px, coord.pz);
  const centerX = coord.px * coord.size;
  const centerZ = coord.pz * coord.size;
  for (let i = 0; i < count; i += 1) {
    const x = centerX - coord.size / 2 + stableUnit(`${state.seed}:${key}:tree:${i}:x`) * coord.size;
    const z = centerZ - coord.size / 2 + stableUnit(`${state.seed}:${key}:tree:${i}:z`) * coord.size;
    const sample = sampleTerrain(world, state, config, query, x, z);
    if (sample.biome !== 'forest' || sample.y < num(state.terrain.waterLevel, -42) + 4 || (1 - sample.normal.y) > num(config.maxScatterSlope, 0.34)) continue;
    const scale = 0.75 + stableUnit(`${state.seed}:${key}:tree:${i}:s`) * 0.65;
    items.push({ id: `${key}:tree:${i}`, type: 'conifer', x, y: sample.y, z, height: (12 + stableUnit(`${state.seed}:${key}:tree:${i}:h`) * 11) * scale, radius: 3.2 * scale, rotation: stableUnit(`${state.seed}:${key}:tree:${i}:r`) * Math.PI * 2 });
  }
  return items;
}

function createPatchDescriptor(world, state, config, coord, options = {}) {
  const segments = Math.max(2, Math.floor(num(coord.sampleSegments, num(config.sampleSegments, num(state.terrain.sampleSegments, 12)))));
  const query = options.query ?? terrainQueryFromConfig(world, config);
  const centerX = coord.px * coord.size;
  const centerZ = coord.pz * coord.size;
  const samples = [];
  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const x = centerX - coord.size / 2 + (xIndex / segments) * coord.size;
      const z = centerZ - coord.size / 2 + (zIndex / segments) * coord.size;
      samples.push(sampleTerrain(world, state, config, query, x, z));
    }
  }
  const id = patchId(coord.lod, coord.px, coord.pz);
  return {
    id,
    key: id,
    lod: coord.lod,
    lodIndex: coord.lodIndex,
    interactive: coord.collision !== false,
    visualOnly: coord.collision === false,
    preload: Boolean(coord.preload),
    priority: coord.priority,
    px: coord.px,
    pz: coord.pz,
    size: coord.size,
    sampleSegments: segments,
    materialScale: coord.materialScale,
    materialDescriptorId: 'terrainStreamer.material',
    samples,
    scatter: createScatterForPatch(world, state, config, coord, query),
    revision: options.revision ?? patchRevisionKey(options.queryVersion ?? 0, coord.lod, segments, coord.size, qualityTierOf(state, config)),
    status: 'ready',
    builtAt: options.frame ?? 0,
    estimatedBuildCost: (segments + 1) * (segments + 1)
  };
}

function queuePatchBuilds(state, coords, revisions, desiredSet) {
  const current = Array.isArray(state.world?.buildQueue) ? state.world.buildQueue.filter((id) => desiredSet.has(id)) : [];
  const queued = new Set(current);
  for (const coord of coords) {
    const id = patchId(coord.lod, coord.px, coord.pz);
    const patch = state.world?.patchRegistry?.[id];
    if (patch?.revision === revisions[id]) continue;
    if (!queued.has(id)) {
      current.push(id);
      queued.add(id);
    }
  }
  return current;
}

function createTerrainMaterialDescriptor(state, config) {
  return {
    id: 'terrainStreamer.material',
    version: TERRAIN_STREAMER_KIT_VERSION,
    qualityTier: qualityTierOf(state, config),
    shader: 'world-space-banded-terrain',
    detailNoiseScale: num(config.detailNoiseScale, 0.018),
    macroNoiseScale: num(config.macroNoiseScale, 0.0026),
    slopeDarkening: num(config.slopeDarkening, 0.32),
    altitudeBands: config.altitudeBands ?? [
      { max: -35, color: '#d9ad6a' },
      { max: 58, color: '#1f4a29' },
      { max: 135, color: '#3f6f3d' },
      { max: 10000, color: '#7e8f9c' }
    ],
    biomeColors: {
      shore: '#d9ad6a',
      forest: '#1f4a29',
      rock: '#6f7678',
      alpine: '#a6b0b7',
      ...(config.biomeColors ?? {})
    }
  };
}

function createFarTerrainDescriptor(state, config, rings) {
  const far = rings[rings.length - 1] ?? {};
  const position = state.body?.position ?? {};
  const radius = num(far.patchSize, 3600) * Math.max(2, num(far.radius, 2));
  return {
    id: 'terrainStreamer.farTerrain',
    enabled: config.farTerrain !== false,
    center: { x: num(position.x), z: num(position.z) },
    innerRadius: radius * 0.55,
    outerRadius: radius * 1.9,
    sampleSegments: Math.max(2, Math.floor(num(far.sampleSegments, 3))),
    materialDescriptorId: 'terrainStreamer.material',
    horizonFade: num(config.horizonFade, 0.72),
    visualOnly: true
  };
}

function createHorizonTerrainDescriptor(state, config) {
  return {
    id: 'terrainStreamer.horizonTerrain',
    enabled: config.horizonTerrain !== false,
    seed: state.seed,
    bandCount: Math.max(3, Math.floor(num(config.horizonBandCount, 7))),
    mountainScale: num(config.horizonMountainScale, 0.18),
    haze: num(config.horizonHaze, 0.62),
    colors: config.horizonColors ?? ['#19262b', '#31434a', '#8fa0a6']
  };
}

function qualityAdjustedBuilds(state, config, queueLength) {
  const tier = qualityTierOf(state, config);
  const configured = Math.max(1, Math.floor(num(config.maxPatchBuildsPerTick, num(config.patchBuildBudget, 1))));
  if (tier === 'low') return 1;
  if (tier === 'high') return Math.max(configured, 2);
  if (tier === 'adaptive' && queueLength > 18) return Math.min(2, Math.max(1, configured + 1));
  return configured;
}

function reconcileTerrainStreamer(world, state, config) {
  const query = terrainQueryFromConfig(world, config);
  const queryVersion = query?.queryVersion ?? 0;
  const { rings, coords } = planLodPatches(state, config);
  const previousWorld = state.world ?? {};
  const patchRegistry = {
    ...(previousWorld.patchRegistry ?? Object.fromEntries((previousWorld.patches ?? []).filter(Boolean).map((patch) => [patch.id ?? patch.key, patch])))
  };
  const desiredIds = coords.map((coord) => patchId(coord.lod, coord.px, coord.pz));
  const desiredSet = new Set(desiredIds);
  const coordById = Object.fromEntries(coords.map((coord) => [patchId(coord.lod, coord.px, coord.pz), coord]));
  const priority = Object.fromEntries(coords.map((coord) => [patchId(coord.lod, coord.px, coord.pz), coord.priority + coord.lodIndex * 10]));
  const revisions = Object.fromEntries(coords.map((coord) => [patchId(coord.lod, coord.px, coord.pz), patchRevisionKey(queryVersion, coord.lod, coord.sampleSegments, coord.size, qualityTierOf(state, config))]));
  let buildQueue = queuePatchBuilds({ ...state, world: { ...previousWorld, patchRegistry } }, coords, revisions, desiredSet)
    .sort((a, b) => num(priority[a], 9999) - num(priority[b], 9999) || a.localeCompare(b));

  const firstBuild = Object.keys(patchRegistry).length === 0;
  const maxBuilds = Math.max(1, Math.floor(firstBuild ? num(config.initialPatchBuilds, 3) : qualityAdjustedBuilds(state, config, buildQueue.length)));
  const builtIds = [];
  let estimatedCost = 0;
  for (let index = 0; index < maxBuilds && buildQueue.length > 0; index += 1) {
    const id = buildQueue.shift();
    const coord = coordById[id];
    if (!coord) continue;
    const patch = createPatchDescriptor(world, state, config, coord, {
      query,
      queryVersion,
      revision: revisions[id],
      frame: now(world)
    });
    patchRegistry[id] = patch;
    estimatedCost += num(patch.estimatedBuildCost);
    builtIds.push(id);
  }

  const maxCached = Math.max(desiredIds.length, Math.floor(num(config.maxCachedPatches, desiredIds.length + maxBuilds * 10)));
  const staleIds = Object.keys(patchRegistry)
    .filter((id) => !desiredSet.has(id))
    .sort((a, b) => num(patchRegistry[b]?.builtAt) - num(patchRegistry[a]?.builtAt));
  let evictedThisTick = 0;
  while (Object.keys(patchRegistry).length > maxCached && staleIds.length > 0) {
    delete patchRegistry[staleIds.pop()];
    evictedThisTick += 1;
  }

  const readyPatches = desiredIds.map((id) => patchRegistry[id]).filter((patch) => patch && patch.revision === revisions[patch.id]);
  const lodCounts = {};
  for (const patch of readyPatches) lodCounts[patch.lod] = (lodCounts[patch.lod] ?? 0) + 1;
  const previousAverage = num(previousWorld.streamingStats?.averageBuildCost, 0);
  const averageBuildCost = builtIds.length ? (previousAverage * 0.86 + (estimatedCost / builtIds.length) * 0.14) : previousAverage;

  state.world = {
    ...previousWorld,
    terrainStreamerVersion: TERRAIN_STREAMER_KIT_VERSION,
    qualityTier: qualityTierOf(state, config),
    center: { x: num(state.body?.position?.x), z: num(state.body?.position?.z) },
    lodRings: rings,
    queryVersion,
    desiredPatchIds: desiredIds,
    loadedPatchIds: readyPatches.map((patch) => patch.id),
    pendingPatchIds: buildQueue.slice(),
    buildQueue,
    patchRegistry,
    patches: readyPatches,
    patchCount: readyPatches.length,
    farTerrain: createFarTerrainDescriptor(state, config, rings),
    horizonTerrain: createHorizonTerrainDescriptor(state, config),
    materialDescriptor: createTerrainMaterialDescriptor(state, config),
    patchCacheKey: `${qualityTierOf(state, config)}:${queryVersion}:${desiredIds.join('|')}`,
    streamingStats: {
      desired: desiredIds.length,
      ready: readyPatches.length,
      pending: buildQueue.length,
      builtThisTick: builtIds.length,
      evictedThisTick,
      maxBuildsPerTick: maxBuilds,
      cached: Object.keys(patchRegistry).length,
      lodCounts,
      averageBuildCost,
      qualityTier: qualityTierOf(state, config)
    }
  };

  return builtIds.length > 0 || buildQueue.length > 0 || evictedThisTick > 0 || previousWorld.patchCacheKey !== state.world.patchCacheKey || (previousWorld.patches?.length ?? 0) !== readyPatches.length;
}

function installTerrainStreamerApi(engine, world, definitions, config, key) {
  engine[key] = {
    getState() {
      return ensureState(world, definitions, config).world;
    },
    getStats() {
      return ensureState(world, definitions, config).world?.streamingStats ?? null;
    },
    getStreamingState() {
      return ensureState(world, definitions, config).world?.streamingStats ?? null;
    },
    setQuality(tier = 'medium') {
      const state = ensureState(world, definitions, config);
      state.world = { ...(state.world ?? {}), qualityTier: tier, patchCacheKey: null, buildQueue: [] };
      writeState(world, definitions, state);
      return state.world;
    },
    forceRebuild() {
      const state = ensureState(world, definitions, config);
      state.world = { ...(state.world ?? {}), patchRegistry: {}, buildQueue: [], patches: [], patchCacheKey: null };
      writeState(world, definitions, state);
      return state.world;
    }
  };
  return engine[key];
}

export const TERRAIN_STREAMER_KIT_DEFINITION = Object.freeze({ id: 'terrain-streamer-kit', provides: ['world:patch-window', 'world:streaming-descriptors', 'world:patch-registry', 'world:patch-build-queue', 'world:terrain-lod', 'world:terrain-preload', 'render:terrain-material-descriptor', 'render:far-terrain', 'render:horizon-terrain'], requires: ['terrain:height-sampler', 'aerial:body'], purpose: 'Domain-service terrain streamer with LOD rings, predictive preload, patch registry, build budget, far terrain, horizon terrain, and material descriptors.' });
export const GENERIC_WORLD_PATCH_KIT_DEFINITION = TERRAIN_STREAMER_KIT_DEFINITION;
export function createTerrainStreamerKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: config.kitId ?? TERRAIN_STREAMER_KIT_DEFINITION.id,
    provides: TERRAIN_STREAMER_KIT_DEFINITION.provides,
    requires: TERRAIN_STREAMER_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'terrain-streamer-system', system(world) {
      const state = ensureState(world, definitions, config);
      if (reconcileTerrainStreamer(world, state, config)) writeState(world, definitions, state);
    } }],
    install({ engine, world }) {
      installTerrainStreamerApi(engine, world, definitions, config, 'terrainStreamer');
      installTerrainStreamerApi(engine, world, definitions, config, 'genericWorldPatch');
    },
    metadata: TERRAIN_STREAMER_KIT_DEFINITION
  });
}

export function createGenericWorldPatchKit(NexusEngine, config = {}) {
  return createTerrainStreamerKit(NexusEngine, { ...config, kitId: config.kitId ?? 'generic-world-patch-kit' });
}

function checkpointForPatch(world, state, config, patch, index) {
  const seed = `${state.seed}:checkpoint:${patch.id}:${index}`;
  const x = patch.px * patch.size - patch.size / 2 + stableUnit(`${seed}:x`) * patch.size;
  const z = patch.pz * patch.size - patch.size / 2 + stableUnit(`${seed}:z`) * patch.size;
  const y = heightAt(world, state, config, x, z) + num(config.minHeight, 60) + stableUnit(`${seed}:h`) * num(config.heightRange, 130);
  return { id: `checkpoint-${patch.id}-${index}`, position: { x, y, z }, radius: num(config.radius, 15), rotationY: stableUnit(`${seed}:rot`) * Math.PI * 2 };
}

function liftForPatch(world, state, config, patch, index) {
  const seed = `${state.seed}:lift:${patch.id}:${index}`;
  const x = patch.px * patch.size - patch.size / 2 + stableUnit(`${seed}:x`) * patch.size;
  const z = patch.pz * patch.size - patch.size / 2 + stableUnit(`${seed}:z`) * patch.size;
  const y = heightAt(world, state, config, x, z) + num(config.baseHeight, 8);
  return { id: `lift-${patch.id}-${index}`, position: { x, y, z }, radius: num(config.radius, 26), height: num(config.height, 180), lift: num(config.lift, num(config.liftForce, 16.5)) };
}

export const GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-checkpoint-volume-kit', provides: ['aerial:checkpoint-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable airborne ring, gate, and checkpoint volumes.' });
export function createGenericCheckpointVolumeKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.id,
    provides: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.provides,
    requires: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION.requires,
    events: { CheckpointCollected: definitions.CheckpointCollected },
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-checkpoint-volume-system', system(world) {
      const state = ensureState(world, definitions, config);
      const density = Math.max(0, Math.floor(num(config.density, 2)));
      const collected = new Set(state.checkpoints?.collectedIds ?? []);
      const patches = (state.world?.patches ?? []).filter((patch) => patch?.interactive !== false);
      const items = [];
      let hitId = null;
      for (const patch of patches) {
        for (let index = 0; index < density; index += 1) {
          const checkpoint = checkpointForPatch(world, state, config, patch, index);
          checkpoint.collected = collected.has(checkpoint.id);
          const p = checkpoint.position;
          const distance = Math.hypot(num(state.body.position.x) - p.x, num(state.body.position.y) - p.y, num(state.body.position.z) - p.z);
          if (!checkpoint.collected && distance < checkpoint.radius) {
            checkpoint.collected = true;
            checkpoint.collectedAt = now(world);
            collected.add(checkpoint.id);
            hitId = checkpoint.id;
            world.emit(definitions.CheckpointCollected, { id: checkpoint.id });
          }
          items.push(checkpoint);
        }
      }
      if (hitId) state.body.velocity = add3(state.body.velocity, mul3(forwardFromRotation(state.body.rotation), num(config.impulse ?? config.rewardImpulse, 30)));
      state.checkpoints = { ...state.checkpoints, items, collectedIds: Array.from(collected), score: collected.size * num(config.scorePerCheckpoint, 100), recentCollectedId: hitId ?? state.checkpoints?.recentCollectedId ?? null };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericCheckpointVolume', config); },
    metadata: GENERIC_CHECKPOINT_VOLUME_KIT_DEFINITION
  });
}

export const GENERIC_LIFT_VOLUME_KIT_DEFINITION = Object.freeze({ id: 'generic-lift-volume-kit', provides: ['aerial:lift-volume'], requires: ['aerial:body', 'terrain:height-sampler', 'world:patch-window'], purpose: 'Patch-stable thermals, vents, fans, and vertical force columns.' });
export function createGenericLiftVolumeKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: GENERIC_LIFT_VOLUME_KIT_DEFINITION.id,
    provides: GENERIC_LIFT_VOLUME_KIT_DEFINITION.provides,
    requires: GENERIC_LIFT_VOLUME_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'resolve', name: 'generic-lift-volume-system', system(world) {
      const state = ensureState(world, definitions, config);
      const density = Math.max(0, Math.floor(num(config.density, 1)));
      const items = [];
      const activeIds = [];
      for (const patch of (state.world?.patches ?? []).filter((entry) => entry?.interactive !== false)) {
        for (let index = 0; index < density; index += 1) {
          const volume = liftForPatch(world, state, config, patch, index);
          const horizontal = Math.hypot(num(state.body.position.x) - volume.position.x, num(state.body.position.z) - volume.position.z);
          const relativeY = num(state.body.position.y) - volume.position.y;
          if (horizontal < volume.radius && relativeY > 0 && relativeY < volume.height) {
            state.body.velocity.y += volume.lift * dt(world);
            activeIds.push(volume.id);
          }
          items.push(volume);
        }
      }
      state.liftVolumes = { ...state.liftVolumes, items, activeIds };
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericLiftVolume', config); },
    metadata: GENERIC_LIFT_VOLUME_KIT_DEFINITION
  });
}

export const GENERIC_FLOCK_AGENT_KIT_DEFINITION = Object.freeze({ id: 'generic-flock-agent-kit', provides: ['ai:flock-agent'], requires: ['aerial:body', 'terrain:height-sampler'], purpose: 'Ambient companion flock agent state.' });
export function createGenericFlockAgentKit(NexusEngine, config = {}) {
  const definitions = createDefinitions(NexusEngine);
  return makeRuntimeKit(NexusEngine, {
    id: GENERIC_FLOCK_AGENT_KIT_DEFINITION.id,
    provides: GENERIC_FLOCK_AGENT_KIT_DEFINITION.provides,
    requires: GENERIC_FLOCK_AGENT_KIT_DEFINITION.requires,
    resources: { State: definitions.State },
    systems: [{ phase: 'simulate', name: 'generic-flock-agent-system', system(world) {
      const state = ensureState(world, definitions, config);
      const delta = dt(world);
      if (!state.flock.agents.length) {
        const random = createRng(`${state.seed}:flock`);
        state.flock.agents = Array.from({ length: num(config.count, 8) }, (_, index) => {
          const x = (random() - 0.5) * 260;
          const z = -180 + (random() - 0.5) * 200;
          return { id: `agent-${index}`, position: { x, y: heightAt(world, state, config, x, z) + 95 + random() * 60, z }, velocity: { x: 0, y: 0, z: -28 }, offset: { x: (random() - 0.5) * 160, y: (random() - 0.5) * 60, z: -70 - random() * 80 }, phase: random() * Math.PI * 2 };
        });
      }
      state.flock.agents = state.flock.agents.map((agent) => {
        const target = add3(state.body.position, agent.offset);
        let velocity = add3(agent.velocity, mul3(norm3({ x: target.x - agent.position.x, y: target.y - agent.position.y, z: target.z - agent.position.z }), num(config.followAcceleration, 18) * delta));
        const ground = heightAt(world, state, config, agent.position.x, agent.position.z) + num(config.groundClearance, 22);
        if (agent.position.y < ground) velocity.y += num(config.avoidanceLift, 18) * delta;
        velocity = add3(velocity, mul3(velocity, -num(config.damping, 0.18) * delta));
        if (len3(velocity) > num(config.maxSpeed, 45)) velocity = mul3(norm3(velocity), num(config.maxSpeed, 45));
        return { ...agent, position: add3(agent.position, mul3(velocity, delta)), velocity, phase: num(agent.phase) + delta * num(config.flapRate, 9) };
      });
      writeState(world, definitions, state);
    } }],
    install({ engine, world }) { installApi(engine, world, definitions, 'genericFlockAgent', config); },
    metadata: GENERIC_FLOCK_AGENT_KIT_DEFINITION
  });
}
