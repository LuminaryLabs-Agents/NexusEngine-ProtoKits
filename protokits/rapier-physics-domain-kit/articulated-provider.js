import { createRapierPhysicsProvider } from "./index.js";

const clone = (value) => value === undefined ? undefined : structuredClone(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function vec3(value = {}, fallback = {}) {
  const source = Array.isArray(value)
    ? { x: value[0], y: value[1], z: value[2] }
    : value ?? {};
  return {
    x: finite(source.x, finite(fallback.x, 0)),
    y: finite(source.y, finite(fallback.y, 0)),
    z: finite(source.z, finite(fallback.z, 0))
  };
}

function quat(value = {}, fallback = {}) {
  const source = Array.isArray(value)
    ? { x: value[0], y: value[1], z: value[2], w: value[3] }
    : value ?? {};
  const next = {
    x: finite(source.x, finite(fallback.x, 0)),
    y: finite(source.y, finite(fallback.y, 0)),
    z: finite(source.z, finite(fallback.z, 0)),
    w: finite(source.w, finite(fallback.w, 1))
  };
  const length = Math.hypot(next.x, next.y, next.z, next.w);
  if (length <= 1e-8) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: next.x / length, y: next.y / length, z: next.z / length, w: next.w / length };
}

function normalizeBody(input = {}, index = 0) {
  return {
    ...clone(input),
    id: String(input.id ?? input.bodyId ?? `articulated-body-${index}`),
    kind: String(input.kind ?? "dynamic"),
    transform: {
      position: vec3(input.transform?.position ?? input.position),
      rotation: quat(input.transform?.rotation ?? input.rotation)
    },
    collision: clone(input.collision ?? input.collider ?? { shape: "capsule", halfHeight: 0.25, radius: 0.12 }),
    linearVelocity: vec3(input.linearVelocity ?? input.velocity),
    tags: asArray(input.tags).map(String)
  };
}

function normalizeConstraint(input = {}, index = 0, articulationId = null) {
  return {
    ...clone(input),
    id: String(input.id ?? input.constraintId ?? input.jointId ?? `joint-${index}`),
    articulationId: input.articulationId == null ? articulationId : String(input.articulationId),
    parentBodyId: String(input.parentBodyId ?? ""),
    childBodyId: String(input.childBodyId ?? ""),
    childBoneId: input.childBoneId == null ? null : String(input.childBoneId),
    type: String(input.type ?? input.kind ?? "fixed").toLowerCase(),
    anchorA: vec3(input.anchorA),
    anchorB: vec3(input.anchorB),
    frameA: quat(input.frameA),
    frameB: quat(input.frameB),
    axis: vec3(input.axis, { x: 1, y: 0, z: 0 }),
    limits: input.limits == null
      ? null
      : {
          minimum: finite(input.limits.minimum ?? input.limits.min, 0),
          maximum: finite(input.limits.maximum ?? input.limits.max, 0)
        },
    contactsEnabled: input.contactsEnabled === true,
    metadata: clone(input.metadata ?? {})
  };
}

function normalizeArticulation(input = {}, index = 0) {
  const id = String(input.id ?? input.articulationId ?? `articulation-${index}`);
  return {
    ...clone(input),
    id,
    rigId: input.rigId == null ? null : String(input.rigId),
    bodies: asArray(input.bodies).map(normalizeBody),
    joints: asArray(input.joints ?? input.constraints).map((joint, jointIndex) =>
      normalizeConstraint(joint, jointIndex, id)
    ),
    ragdollWeight: Math.max(0, Math.min(1, finite(input.ragdollWeight, 0)))
  };
}

function normalizeMotor(input = {}, index = 0) {
  const request = {
    ...clone(input),
    id: String(input.id ?? `joint-motor-${index}`),
    articulationId: input.articulationId == null ? null : String(input.articulationId),
    jointId: String(input.jointId ?? input.constraintId ?? ""),
    mode: String(input.mode ?? (input.targetVelocity == null ? "position" : "velocity")),
    stiffness: Math.max(0, finite(input.stiffness, 120)),
    damping: Math.max(0, finite(input.damping, 18)),
    maximumForce: Math.max(0, finite(input.maximumForce ?? input.maximumTorque, 80))
  };
  if (input.targetPosition != null) request.targetPosition = finite(input.targetPosition, 0);
  if (input.targetVelocity != null) request.targetVelocity = finite(input.targetVelocity, 0);
  if (input.targetRotation != null) request.targetRotation = quat(input.targetRotation);
  return request;
}

function makeCapturingRapier(rapier, capture) {
  if (!rapier?.World) return rapier;
  class CapturingWorld {
    constructor(gravity) {
      const source = new rapier.World(gravity);
      const proxy = new Proxy(source, {
        get(target, property) {
          if (property === "createRigidBody") {
            return (descriptor) => {
              const body = target.createRigidBody(descriptor);
              capture.createdBodies.push(body);
              return body;
            };
          }
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
        set(target, property, value) {
          return Reflect.set(target, property, value, target);
        }
      });
      capture.world = proxy;
      capture.createdBodies = [];
      capture.generation += 1;
      return proxy;
    }
  }
  const wrapped = Object.create(rapier);
  Object.defineProperty(wrapped, "World", { value: CapturingWorld, enumerable: true });
  return wrapped;
}

function jointData(rapier, descriptor) {
  const JointData = rapier?.JointData;
  if (!JointData) return null;
  const a = descriptor.anchorA;
  const b = descriptor.anchorB;
  const axis = descriptor.axis;
  let data = null;
  if (descriptor.type === "fixed" && typeof JointData.fixed === "function") {
    data = JointData.fixed(a, descriptor.frameA, b, descriptor.frameB);
  } else if (descriptor.type === "spherical" && typeof JointData.spherical === "function") {
    data = JointData.spherical(a, b);
  } else if (descriptor.type === "revolute" && typeof JointData.revolute === "function") {
    data = JointData.revolute(a, b, axis);
  } else if (descriptor.type === "prismatic" && typeof JointData.prismatic === "function") {
    data = JointData.prismatic(a, b, axis);
  }
  if (data && descriptor.limits) {
    data.limitsEnabled = true;
    data.limits = [descriptor.limits.minimum, descriptor.limits.maximum];
  }
  return data;
}

function signedQuaternionAngle(rotation, axis) {
  const q = quat(rotation);
  const sineLength = Math.hypot(q.x, q.y, q.z);
  if (sineLength <= 1e-8) return 0;
  const angle = 2 * Math.atan2(sineLength, q.w);
  const sign = q.x * axis.x + q.y * axis.y + q.z * axis.z < 0 ? -1 : 1;
  return angle * sign;
}

function readJointPosition(handle) {
  try {
    if (typeof handle?.angle === "function") return finite(handle.angle(), 0);
  } catch {}
  try {
    if (typeof handle?.translation === "function") return finite(handle.translation(), 0);
  } catch {}
  return 0;
}

export const RAPIER_ARTICULATED_PHYSICS_PROVIDER_VERSION = "0.1.0";

export function createRapierArticulatedPhysicsProvider(options = {}) {
  const rapier = options.rapier ?? options.RAPIER ?? null;
  const capture = { world: null, createdBodies: [], generation: 0 };
  const base = createRapierPhysicsProvider({
    ...options,
    id: options.id ?? "rapier-articulated",
    rapier: makeCapturingRapier(rapier, capture),
    RAPIER: undefined
  });

  const rootBodies = new Map();
  const colliders = new Map();
  const articulations = new Map();
  const constraints = new Map();
  const bodyHandles = new Map();
  const jointHandles = new Map();
  const motorRequests = new Map();
  const diagnostics = [];
  let lastFrame = null;
  let knownGeneration = 0;

  const allBodies = () => {
    const output = new Map(rootBodies);
    for (const articulation of articulations.values()) {
      for (const body of articulation.bodies) output.set(body.id, body);
    }
    return [...output.values()];
  };

  const allConstraints = () => {
    const output = new Map(constraints);
    for (const articulation of articulations.values()) {
      for (const joint of articulation.joints) output.set(joint.id, joint);
    }
    return [...output.values()];
  };

  function reconcileBodyHandles(descriptors) {
    if (capture.generation !== knownGeneration) {
      bodyHandles.clear();
      jointHandles.clear();
      knownGeneration = capture.generation;
    }
    const desiredIds = new Set(descriptors.map((descriptor) => descriptor.id));
    for (const id of bodyHandles.keys()) {
      if (!desiredIds.has(id)) bodyHandles.delete(id);
    }
    let createdIndex = 0;
    for (const descriptor of descriptors) {
      if (!bodyHandles.has(descriptor.id)) {
        const body = capture.createdBodies[createdIndex++];
        if (body) bodyHandles.set(descriptor.id, body);
      }
    }
  }

  function syncCombinedBodies() {
    const descriptors = allBodies();
    capture.createdBodies = [];
    base.syncBodies(descriptors);
    reconcileBodyHandles(descriptors);
    return descriptors;
  }

  function removeJoint(id) {
    const handle = jointHandles.get(id);
    if (handle && capture.world?.removeImpulseJoint) {
      try {
        capture.world.removeImpulseJoint(handle, true);
      } catch {
        try { capture.world.removeImpulseJoint(handle); } catch {}
      }
    }
    jointHandles.delete(id);
  }

  function syncJoints() {
    const desired = new Map(allConstraints().map((descriptor) => [descriptor.id, descriptor]));
    for (const id of jointHandles.keys()) {
      if (!desired.has(id)) removeJoint(id);
    }
    for (const descriptor of desired.values()) {
      if (jointHandles.has(descriptor.id)) {
        const handle = jointHandles.get(descriptor.id);
        if (descriptor.limits && typeof handle?.setLimits === "function") {
          try { handle.setLimits(descriptor.limits.minimum, descriptor.limits.maximum); } catch {}
        }
        handle?.setContactsEnabled?.(descriptor.contactsEnabled);
        continue;
      }
      const parent = bodyHandles.get(descriptor.parentBodyId);
      const child = bodyHandles.get(descriptor.childBodyId);
      if (!parent || !child) {
        diagnostics.push({ type: "missing-joint-body", jointId: descriptor.id, parentBodyId: descriptor.parentBodyId, childBodyId: descriptor.childBodyId });
        continue;
      }
      const data = jointData(rapier, descriptor);
      if (!data || typeof capture.world?.createImpulseJoint !== "function") {
        diagnostics.push({ type: "unsupported-joint", jointId: descriptor.id, jointType: descriptor.type });
        continue;
      }
      try {
        const handle = capture.world.createImpulseJoint(data, parent, child, true);
        handle?.setContactsEnabled?.(descriptor.contactsEnabled);
        if (descriptor.limits && typeof handle?.setLimits === "function") {
          handle.setLimits(descriptor.limits.minimum, descriptor.limits.maximum);
        }
        jointHandles.set(descriptor.id, handle);
      } catch (error) {
        diagnostics.push({ type: "joint-create-failed", jointId: descriptor.id, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return [...desired.values()];
  }

  function applyMotors() {
    const constraintById = new Map(allConstraints().map((constraint) => [constraint.id, constraint]));
    for (const request of motorRequests.values()) {
      const handle = jointHandles.get(request.jointId);
      const descriptor = constraintById.get(request.jointId);
      if (!handle || !descriptor) continue;
      try {
        const targetPosition = request.targetPosition ?? (request.targetRotation == null
          ? null
          : signedQuaternionAngle(request.targetRotation, descriptor.axis));
        if (targetPosition != null && request.targetVelocity != null && typeof handle.configureMotor === "function") {
          handle.configureMotor(targetPosition, request.targetVelocity, request.stiffness, request.damping);
        } else if (targetPosition != null && typeof handle.configureMotorPosition === "function") {
          handle.configureMotorPosition(targetPosition, request.stiffness, request.damping);
        } else if (request.targetVelocity != null && typeof handle.configureMotorVelocity === "function") {
          handle.configureMotorVelocity(request.targetVelocity, request.damping);
        }
      } catch (error) {
        diagnostics.push({ type: "joint-motor-failed", jointId: request.jointId, message: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  function articulationFrame(baseFrame) {
    const constraintList = allConstraints();
    const jointResults = constraintList.map((constraint) => {
      const handle = jointHandles.get(constraint.id);
      const request = [...motorRequests.values()].find((entry) => entry.jointId === constraint.id) ?? null;
      const position = readJointPosition(handle);
      const target = request?.targetPosition ?? (request?.targetRotation == null ? position : signedQuaternionAngle(request.targetRotation, constraint.axis));
      return {
        jointId: constraint.id,
        articulationId: constraint.articulationId,
        position,
        velocity: 0,
        rotation: request?.targetRotation ?? { x: 0, y: 0, z: 0, w: 1 },
        targetError: Math.abs(target - position),
        limitState: null,
        backendActive: Boolean(handle)
      };
    });
    const constraintResults = constraintList.map((constraint) => ({
      constraintId: constraint.id,
      articulationId: constraint.articulationId,
      satisfied: jointHandles.has(constraint.id),
      error: jointHandles.has(constraint.id) ? 0 : 1,
      impulse: 0,
      limitState: null
    }));
    const articulationResults = [...articulations.values()].map((articulation) => ({
      articulationId: articulation.id,
      rigId: articulation.rigId,
      ragdollWeight: articulation.ragdollWeight,
      bodyResults: (baseFrame.bodyResults ?? []).filter((result) => articulation.bodies.some((body) => body.id === result.bodyId)),
      jointResults: jointResults.filter((result) => result.articulationId === articulation.id),
      diagnostics: diagnostics.filter((entry) => entry.articulationId === articulation.id)
    }));
    return { constraintResults, jointResults, articulationResults };
  }

  const provider = {
    id: String(options.id ?? "rapier-articulated"),
    initialize(context) {
      const result = base.initialize(context);
      knownGeneration = capture.generation;
      return provider.id || result;
    },
    syncBodies(descriptors = []) {
      rootBodies.clear();
      for (const descriptor of asArray(descriptors).map(normalizeBody)) rootBodies.set(descriptor.id, descriptor);
      const result = syncCombinedBodies();
      syncJoints();
      return clone(result);
    },
    syncColliders(descriptors = []) {
      colliders.clear();
      for (const descriptor of asArray(descriptors)) colliders.set(String(descriptor.id ?? descriptor.colliderId), clone(descriptor));
      return base.syncColliders([...colliders.values()]);
    },
    submitMotionRequests(requests = []) {
      return base.submitMotionRequests(requests);
    },
    syncConstraints(descriptors = []) {
      constraints.clear();
      asArray(descriptors).map(normalizeConstraint).forEach((descriptor) => constraints.set(descriptor.id, descriptor));
      syncJoints();
      return clone([...constraints.values()]);
    },
    syncArticulations(descriptors = []) {
      articulations.clear();
      asArray(descriptors).map(normalizeArticulation).forEach((descriptor) => articulations.set(descriptor.id, descriptor));
      syncCombinedBodies();
      syncJoints();
      return clone([...articulations.values()]);
    },
    submitJointMotorRequests(requests = []) {
      motorRequests.clear();
      asArray(requests).map(normalizeMotor).forEach((request) => motorRequests.set(request.id, request));
      return clone([...motorRequests.values()]);
    },
    step(tickContext = {}) {
      applyMotors();
      base.step(tickContext);
      const baseFrame = base.getFrame() ?? {};
      lastFrame = {
        ...baseFrame,
        ...articulationFrame(baseFrame),
        providerId: provider.id
      };
      structuredClone(lastFrame);
      motorRequests.clear();
      return clone(lastFrame);
    },
    getFrame() {
      return clone(lastFrame);
    },
    getSnapshot() {
      return clone({
        version: RAPIER_ARTICULATED_PHYSICS_PROVIDER_VERSION,
        ...base.getSnapshot(),
        id: provider.id,
        bodies: allBodies(),
        colliders: [...colliders.values()],
        articulations: [...articulations.values()],
        constraints: allConstraints(),
        motorRequests: [...motorRequests.values()],
        activeJointIds: [...jointHandles.keys()].sort(),
        diagnostics,
        lastFrame
      });
    },
    reset() {
      for (const id of [...jointHandles.keys()]) removeJoint(id);
      base.reset();
      knownGeneration = capture.generation;
      bodyHandles.clear();
      lastFrame = null;
      motorRequests.clear();
      diagnostics.length = 0;
      syncCombinedBodies();
      base.syncColliders([...colliders.values()]);
      syncJoints();
      return true;
    },
    dispose() {
      for (const id of [...jointHandles.keys()]) removeJoint(id);
      jointHandles.clear();
      bodyHandles.clear();
      rootBodies.clear();
      colliders.clear();
      articulations.clear();
      constraints.clear();
      motorRequests.clear();
      lastFrame = null;
      base.dispose();
      return true;
    }
  };

  return provider;
}

export default createRapierArticulatedPhysicsProvider;
