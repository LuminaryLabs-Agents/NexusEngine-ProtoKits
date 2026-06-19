import { asFluidArray, cloneFluidValue, createFluidServiceKit, toFluidNumber } from "../fluid-field-kit/index.js";

export const WATER_MESH_KIT_VERSION = "0.1.0";

function normalizeMesh(mesh = {}, index = 0) {
  const policy = String(mesh.policy ?? mesh.meshPolicy ?? "tile-grid");
  const density = Math.max(2, Math.floor(toFluidNumber(mesh.density, policy === "projected-grid" ? 48 : 24)));
  return {
    id: String(mesh.id ?? `water-mesh-${index + 1}`),
    bodyId: String(mesh.bodyId ?? "demo-pond"),
    policy,
    density,
    lod: String(mesh.lod ?? "near"),
    bounds: cloneFluidValue(mesh.bounds ?? { x: -40, z: -24, width: 80, depth: 48 }),
    vertexBudget: density * density,
    tags: asFluidArray(mesh.tags ?? [policy]).map(String)
  };
}

function createInitial(config = {}) {
  const meshes = asFluidArray(config.meshes ?? [{ id: "demo-pond-mesh", bodyId: "demo-pond", policy: "tile-grid", density: 40 }]).map(normalizeMesh);
  return { meshes, meshesById: Object.fromEntries(meshes.map((mesh) => [mesh.id, mesh])), totalVertexBudget: meshes.reduce((sum, mesh) => sum + mesh.vertexBudget, 0) };
}

export function createWaterMeshKit(NexusRealtime, config = {}) {
  return createFluidServiceKit(NexusRealtime, {
    version: WATER_MESH_KIT_VERSION,
    factoryName: "createWaterMeshKit",
    kitId: "water-mesh-kit",
    engineKey: "waterMesh",
    resourceName: "waterMesh.state",
    eventStem: "waterMesh",
    domain: "fluid.water",
    service: "mesh",
    requires: ["water:data", "water:stream", "water:surface"],
    provides: ["water:mesh", "water:geometry-descriptors"],
    purpose: "Water geometry policy for planes, tile grids, projected ocean grids, river strips, and shoreline meshes.",
    createInitial,
    reduceAction(state, event) {
      if (event.type === "set-meshes") {
        const meshes = asFluidArray(event.meshes).map(normalizeMesh);
        return { ...state, meshes, meshesById: Object.fromEntries(meshes.map((mesh) => [mesh.id, mesh])), totalVertexBudget: meshes.reduce((sum, mesh) => sum + mesh.vertexBudget, 0) };
      }
      return state;
    },
    methods({ getState, patchState }) {
      function setMeshes(meshes) {
        const normalized = asFluidArray(meshes).map(normalizeMesh);
        return patchState({ meshes: normalized, meshesById: Object.fromEntries(normalized.map((mesh) => [mesh.id, mesh])), totalVertexBudget: normalized.reduce((sum, mesh) => sum + mesh.vertexBudget, 0) }, "set-meshes");
      }
      function buildDescriptors(bodies = []) {
        const source = bodies.length ? bodies : getState().meshes;
        return source.map((entry, index) => normalizeMesh({ ...entry, id: entry.id ?? `water-mesh-${index + 1}`, bodyId: entry.bodyId ?? entry.id, policy: entry.meshPolicy ?? entry.policy, bounds: entry.bounds }, index));
      }
      return { setMeshes, buildDescriptors };
    }
  }, config);
}

export default createWaterMeshKit;
