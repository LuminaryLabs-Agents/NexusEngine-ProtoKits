export const VEGETATION_FOOTPRINT_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createVegetationFootprintDomainKit requires NexusRealtime.${key}.`);
  }
}

function createState(config = {}) {
  return { version: VEGETATION_FOOTPRINT_DOMAIN_KIT_VERSION, id: config.stateId ?? "vegetation-footprint-domain", domain: "vegetation-footprint", accepted: [], rejected: [], lastResult: null, minSpacing: toNumber(config.minSpacing, 0.25) };
}

function overlaps(a, b, extra = 0) {
  const dx = toNumber(a.x, 0) - toNumber(b.x, 0);
  const zA = toNumber(a.z, 0);
  const zB = toNumber(b.z, 0);
  const dz = zA - zB;
  const distance = Math.hypot(dx, dz);
  return distance < toNumber(a.radius, 0) + toNumber(b.radius, 0) + extra;
}

export function createVegetationFootprintDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const VegetationFootprintState = defineResource(config.resourceName ?? "vegetationFootprintDomain.state");
  const VegetationFootprintAccepted = defineEvent("vegetationFootprint.accepted");
  const VegetationFootprintRejected = defineEvent("vegetationFootprint.rejected");

  return defineRuntimeKit({
    id: config.kitId ?? "vegetation-footprint-domain-kit",
    provides: ["n:vegetation-footprint", "vegetation:footprint-validation"],
    resources: { VegetationFootprintState },
    events: { VegetationFootprintAccepted, VegetationFootprintRejected },
    systems: [],
    initWorld({ world }) { world.setResource(VegetationFootprintState, createState(config)); },
    install({ engine, world }) {
      engine.vegetationFootprintDomain = {
        tryPlace(candidate = {}) {
          const state = world.getResource(VegetationFootprintState) ?? createState(config);
          const placement = { id: String(candidate.id ?? `veg-${state.accepted.length}`), x: toNumber(candidate.x, 0), z: toNumber(candidate.z, 0), radius: Math.max(0, toNumber(candidate.radius ?? candidate.clearRadius, 1)), metadata: clone(candidate.metadata ?? {}) };
          const hit = state.accepted.find((item) => overlaps(placement, item, state.minSpacing));
          if (hit) {
            const rejection = { ...placement, ok: false, reason: "footprint-overlap", overlaps: hit.id };
            const next = { ...state, rejected: [...state.rejected, rejection], lastResult: rejection };
            world.setResource(VegetationFootprintState, next);
            world.emit(VegetationFootprintRejected, rejection);
            return clone(rejection);
          }
          const accepted = { ...placement, ok: true };
          const next = { ...state, accepted: [...state.accepted, accepted], lastResult: accepted };
          world.setResource(VegetationFootprintState, next);
          world.emit(VegetationFootprintAccepted, accepted);
          return clone(accepted);
        },
        getState() { return clone(world.getResource(VegetationFootprintState)); }
      };
    },
    metadata: { domain: "vegetation-footprint", parentDomain: "vegetation", scope: "atomic-domain", extendsBase: "DomainServiceKit", composes: ["vegetation-scale-domain-kit", "route-clearance-domain-kit"], ownsLoop: false, purpose: "Owns scaled vegetation footprint validation and overlap rejection." }
  });
}

export default createVegetationFootprintDomainKit;
