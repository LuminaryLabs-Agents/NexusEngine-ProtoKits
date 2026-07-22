export const PHYSICS_BODY_WEIGHT_SOURCE_PROJECTION_KIT_VERSION = "0.1.0";

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function normalizeTags(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((tag) => typeof tag === "string");
}

function requireEndpointApis(engine) {
  if (typeof engine?.n?.physicsBodyLite?.getBody !== "function") {
    throw new TypeError("physics-body-weight-source-projection-kit requires engine.n.physicsBodyLite.getBody.");
  }
  if (typeof engine?.n?.weightedTrigger?.setWeightSource !== "function") {
    throw new TypeError("physics-body-weight-source-projection-kit requires engine.n.weightedTrigger.setWeightSource.");
  }
  return engine.n.weightedTrigger;
}

export function createPhysicsBodyWeightSourceProjectionKit(NexusEngine, config = {}) {
  if (typeof NexusEngine?.defineRuntimeKit !== "function") {
    throw new TypeError("createPhysicsBodyWeightSourceProjectionKit requires NexusEngine.defineRuntimeKit.");
  }

  return NexusEngine.defineRuntimeKit({
    id: config.kitId ?? "physics-body-weight-source-projection-kit",
    requires: ["physics:body-lite", "trigger:weighted"],
    provides: ["trigger:weighted-source-ingestion:physics-body"],
    resources: {},
    events: {},
    systems: [],
    install({ engine }) {
      const weightedTrigger = requireEndpointApis(engine);
      const sourceIngestion = weightedTrigger.sourceIngestion && typeof weightedTrigger.sourceIngestion === "object"
        ? weightedTrigger.sourceIngestion
        : {};

      sourceIngestion.projectPhysicsBody = function projectPhysicsBody(payload = {}) {
        const bodyId = payload?.bodyId;
        if (typeof bodyId !== "string" || bodyId.trim().length === 0) {
          return { accepted: false, reason: "body-id-required" };
        }

        const body = engine.n.physicsBodyLite.getBody(bodyId);
        if (!body) {
          return { accepted: false, reason: "physics-body-not-found", bodyId };
        }

        const source = {
          id: body.id,
          position: clone(body.position),
          weight: body.mass,
          tags: normalizeTags(payload.tags),
          disabled: Boolean(payload.disabled)
        };
        engine.n.weightedTrigger.setWeightSource(source);
        return { accepted: true, bodyId, source: clone(source) };
      };

      weightedTrigger.sourceIngestion = sourceIngestion;
    },
    metadata: {
      version: PHYSICS_BODY_WEIGHT_SOURCE_PROJECTION_KIT_VERSION,
      domain: "weighted-trigger",
      parentDomain: "weighted-trigger",
      subdomain: "weighted-source-ingestion",
      scope: "atomic-adapter-domain",
      layer: "behavior",
      ownsLoop: false,
      engineNamespace: "engine.n.weightedTrigger.sourceIngestion",
      purpose: "Project one authoritative Physics Body Lite snapshot into one same-id Weighted Trigger source upsert.",
      boundary: "Owns only body snapshot to weight-source projection. It owns no state, events, systems, descriptors, lifecycle, settled policy, compatibility alias, or engine tick."
    }
  });
}

export default createPhysicsBodyWeightSourceProjectionKit;
