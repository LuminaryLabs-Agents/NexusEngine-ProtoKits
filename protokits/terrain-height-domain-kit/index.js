export const TERRAIN_HEIGHT_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusEngine) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusEngine?.[key] !== "function") {
      throw new TypeError(`createTerrainHeightDomainKit requires NexusEngine.${key}.`);
    }
  }
}

function defaultHeightAt(x, z) {
  return Math.sin(x * 0.08) * 0.22 + Math.cos(z * 0.06) * 0.18 + Math.sin((x + z) * 0.035) * 0.28;
}

function createState(config = {}) {
  return {
    version: TERRAIN_HEIGHT_DOMAIN_KIT_VERSION,
    id: config.stateId ?? "terrain-height-domain",
    domain: "terrain-height",
    sampleCount: 0,
    lastSample: null,
    bounds: clone(config.bounds ?? null)
  };
}

export function createTerrainHeightDomainKit(NexusEngine, config = {}) {
  requireNexus(NexusEngine);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusEngine;
  const TerrainHeightState = defineResource(config.resourceName ?? "terrainHeightDomain.state");
  const TerrainHeightSampled = defineEvent("terrainHeight.sampled");
  const heightAtImpl = typeof config.heightAt === "function" ? config.heightAt : defaultHeightAt;

  return defineRuntimeKit({
    id: config.kitId ?? "terrain-height-domain-kit",
    provides: ["n:terrain-height", "terrain:height-sampler"],
    resources: { TerrainHeightState },
    events: { TerrainHeightSampled },
    systems: [],
    initWorld({ world }) {
      world.setResource(TerrainHeightState, createState(config));
    },
    install({ engine, world }) {
      engine.terrainHeightDomain = {
        heightAt(x = 0, z = 0, payload = {}) {
          const sample = { x: toNumber(x, 0), z: toNumber(z, 0) };
          const y = toNumber(heightAtImpl(sample.x, sample.z, payload), 0);
          const state = world.getResource(TerrainHeightState) ?? createState(config);
          const next = { ...state, sampleCount: state.sampleCount + 1, lastSample: { ...sample, y } };
          world.setResource(TerrainHeightState, next);
          world.emit(TerrainHeightSampled, { ...sample, y });
          return y;
        },
        sample(point = {}) {
          const y = this.heightAt(point.x, point.z, point);
          return { x: toNumber(point.x, 0), y, z: toNumber(point.z, 0) };
        },
        getState() {
          return clone(world.getResource(TerrainHeightState));
        }
      };
    },
    metadata: {
      domain: "terrain-height",
      parentDomain: "terrain",
      scope: "atomic-domain",
      extendsBase: "DomainServiceKit",
      composes: ["terrain-domain-kit", "ground-contact-domain-kit"],
      ownsLoop: false,
      purpose: "Owns deterministic terrain height sampling for grounding, placement, and render descriptors."
    }
  });
}

export default createTerrainHeightDomainKit;
