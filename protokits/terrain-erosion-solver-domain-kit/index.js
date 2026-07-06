import { clamp, defineInjectedRuntimeKit, number } from "../foundation-kit/index.js";

export const TERRAIN_EROSION_SOLVER_DOMAIN_KIT_VERSION = "0.1.0";

export const DEFAULT_TERRAIN_EROSION_PRESET = Object.freeze({
  model: "situation-response-v1",
  cutScale: 18,
  depositScale: 6,
  wetnessScale: 1,
  roughnessScale: 0.16,
  minResistance: 0.04,
  maxCut: 42,
  maxDeposit: 18
});

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function defineResource(NexusRealtime, name) {
  return typeof NexusRealtime.defineResource === "function" ? NexusRealtime.defineResource(name) : `resource:${name}`;
}

function safeVec3(value = {}) {
  return {
    x: number(value.x, 0),
    y: number(value.y, 0),
    z: number(value.z, 0)
  };
}

function materialSoftness(material = "soil", override = undefined) {
  if (Number.isFinite(Number(override))) return clamp(number(override), 0, 1);
  switch (String(material).toLowerCase()) {
    case "sand": return 0.86;
    case "silt": return 0.78;
    case "soil": return 0.62;
    case "mud": return 0.74;
    case "snow": return 0.58;
    case "gravel": return 0.46;
    case "rock": return 0.18;
    case "ice": return 0.22;
    default: return 0.5;
  }
}

function normalizeSituation(input = {}) {
  const rainfall = clamp(number(input.rainfall, 0.35), 0, 4);
  const waterFlow = clamp(number(input.waterFlow, input.flow ?? 0), 0, 4);
  const localSlope = Math.max(0, number(input.localSlope ?? input.slope, 0));
  const curvature = number(input.curvature, 0);
  const upstreamArea = Math.max(0, number(input.upstreamArea, 1));
  const vegetationCover = clamp(number(input.vegetationCover, 0.25), 0, 1);
  const soilHardness = clamp(number(input.soilHardness, 0.35), 0, 1);
  const softness = materialSoftness(input.material, input.materialSoftness);
  const exposureTime = Math.max(0, number(input.exposureTime, 1));
  const freezeThaw = clamp(number(input.freezeThaw, 0), 0, 2);
  const wind = clamp(number(input.wind, 0), 0, 3);
  const position = input.position ?? { x: input.x, y: input.y, z: input.z };

  return {
    position: safeVec3(position),
    baseHeight: number(input.baseHeight, 0),
    normal: safeVec3(input.normal ?? { x: 0, y: 1, z: 0 }),
    localSlope,
    curvature,
    rainfall,
    waterFlow,
    upstreamArea,
    vegetationCover,
    soilHardness,
    material: input.material ?? "soil",
    materialSoftness: softness,
    exposureTime,
    temperature: number(input.temperature, 12),
    freezeThaw,
    wind
  };
}

export function solveTerrainErosionAt(input = {}, preset = {}) {
  const config = { ...DEFAULT_TERRAIN_EROSION_PRESET, ...(preset ?? {}) };
  const situation = normalizeSituation(input);
  const slopeForce = situation.localSlope * (0.42 + situation.rainfall * 0.58);
  const flowForce = situation.waterFlow * Math.sqrt(1 + situation.upstreamArea) * 0.46;
  const curvatureFocus = clamp(situation.curvature * 0.5 + 0.5, 0, 1);
  const weathering = (situation.freezeThaw * 0.12 + situation.wind * 0.04) * situation.materialSoftness;
  const resistance = Math.max(number(config.minResistance, 0.04), situation.soilHardness * 0.72 + situation.vegetationCover * 0.38 + (1 - situation.materialSoftness) * 0.52);
  const rawCut = Math.max(0, slopeForce + flowForce + curvatureFocus * 0.28 + weathering - resistance);
  const cut = clamp(rawCut * situation.exposureTime, 0, 1);
  const depositionBias = clamp((1 - situation.localSlope) * (0.34 + situation.waterFlow * 0.22) + Math.max(0, -situation.curvature) * 0.24, 0, 1);
  const sediment = cut * number(config.depositScale, 6) * (0.45 + depositionBias);
  const heightDelta = clamp(-cut * number(config.cutScale, 18) + sediment * 0.18, -number(config.maxCut, 42), number(config.maxDeposit, 18));
  const wetness = clamp((situation.rainfall * 0.25 + situation.waterFlow * 0.55 + depositionBias * 0.2) * number(config.wetnessScale, 1), 0, 1);
  const roughnessDelta = clamp((cut * 0.7 + weathering * 0.3) * number(config.roughnessScale, 0.16), 0, 1);

  return {
    model: config.model,
    position: clone(situation.position),
    input: situation,
    heightDelta,
    sedimentDelta: sediment,
    flowStrength: clamp(flowForce, 0, 1),
    wetness,
    roughnessDelta,
    normalDelta: {
      x: -situation.normal.x * roughnessDelta * 0.08,
      y: -roughnessDelta * 0.025,
      z: -situation.normal.z * roughnessDelta * 0.08
    },
    materialHints: {
      exposeRock: clamp(cut * (1 - situation.materialSoftness) + situation.localSlope * 0.28, 0, 1),
      depositSilt: clamp(depositionBias * (sediment / Math.max(1, number(config.depositScale, 6))), 0, 1),
      washGrass: clamp(cut * (1 - situation.vegetationCover), 0, 1),
      wetSoil: wetness
    },
    debug: {
      slopeForce,
      flowForce,
      curvatureFocus,
      weathering,
      resistance,
      rawCut,
      cut,
      depositionBias
    }
  };
}

export function solveTerrainErosionField(input = {}, preset = {}) {
  const samples = Array.isArray(input.samples) ? input.samples : [];
  return {
    fieldId: input.fieldId ?? "terrain-erosion-field",
    model: preset.model ?? DEFAULT_TERRAIN_EROSION_PRESET.model,
    dt: number(input.dt, 1),
    samples: samples.map((sample, index) => ({
      id: sample.id ?? `${input.fieldId ?? "erosion-field"}:sample:${index}`,
      ...solveTerrainErosionAt({ ...sample, exposureTime: number(sample.exposureTime, input.dt ?? 1) }, preset)
    }))
  };
}

export function createTerrainErosionSolverState(options = {}) {
  return {
    id: options.id ?? "terrain-erosion-solver",
    version: TERRAIN_EROSION_SOLVER_DOMAIN_KIT_VERSION,
    preset: { ...DEFAULT_TERRAIN_EROSION_PRESET, ...(options.preset ?? {}) },
    lastSolve: null,
    solveCount: 0,
    fieldCount: 0,
    validation: {
      solverOnly: true,
      doesNotAuthorTerrain: true,
      doesNotPlaceRivers: true,
      doesNotRenderMeshes: true,
      situationInResponseOut: true
    }
  };
}

export function createTerrainErosionSolverDomainKit(NexusRealtime = {}, options = {}) {
  const State = defineResource(NexusRealtime, options.resourceName ?? "terrainErosionSolver.state");
  return defineInjectedRuntimeKit(NexusRealtime, {
    id: options.kitId ?? "terrain-erosion-solver-domain-kit",
    provides: ["terrain:erosion-solver", "terrain:erosion-response", "terrain:erosion-descriptors"],
    requires: [],
    resources: { State },
    systems: [],
    initWorld({ world }) {
      world.setResource(State, createTerrainErosionSolverState(options));
    },
    install({ engine, world }) {
      engine.terrainErosionSolver = {
        getState: () => world.getResource(State),
        getSnapshot: () => clone(world.getResource(State)),
        solveAt(input = {}, presetOverride = {}) {
          const state = world.getResource(State);
          const result = solveTerrainErosionAt(input, { ...state.preset, ...presetOverride });
          world.setResource(State, { ...state, lastSolve: clone(result), solveCount: state.solveCount + 1 });
          return result;
        },
        solveField(input = {}, presetOverride = {}) {
          const state = world.getResource(State);
          const field = solveTerrainErosionField(input, { ...state.preset, ...presetOverride });
          world.setResource(State, { ...state, lastSolve: clone(field), fieldCount: state.fieldCount + 1, solveCount: state.solveCount + field.samples.length });
          return field;
        },
        setPreset(preset = {}) {
          const state = world.getResource(State);
          const next = { ...state, preset: { ...state.preset, ...preset } };
          world.setResource(State, next);
          return next;
        },
        reset() {
          const next = createTerrainErosionSolverState(options);
          world.setResource(State, next);
          return next;
        }
      };
    },
    metadata: {
      version: TERRAIN_EROSION_SOLVER_DOMAIN_KIT_VERSION,
      domain: "terrain-erosion-solver",
      purpose: "Calculate erosion response for supplied terrain situations without authoring terrain, rivers, meshes, or renderer behavior."
    }
  });
}

export const createErosionSolverDomainKit = createTerrainErosionSolverDomainKit;
