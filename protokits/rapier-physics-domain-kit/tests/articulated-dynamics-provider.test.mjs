import assert from "node:assert/strict";
import { createRapierArticulatedPhysicsProvider } from "../articulated-provider.js";

class FakeRigidBodyDesc {
  constructor(kind) {
    this.kind = kind;
    this.translation = { x: 0, y: 0, z: 0 };
  }
  setTranslation(x, y, z) {
    this.translation = { x, y, z };
    return this;
  }
  static kinematicPositionBased() { return new FakeRigidBodyDesc("kinematic"); }
  static dynamic() { return new FakeRigidBodyDesc("dynamic"); }
  static fixed() { return new FakeRigidBodyDesc("fixed"); }
}

class FakeColliderDesc {
  constructor(kind, values) {
    this.kind = kind;
    Object.assign(this, values);
  }
  static capsule(halfHeight, radius) { return new FakeColliderDesc("capsule", { halfHeight, radius }); }
  static cuboid(halfX, halfY, halfZ) { return new FakeColliderDesc("cuboid", { halfX, halfY, halfZ, radius: Math.hypot(halfX, halfZ) }); }
  static cylinder(halfHeight, radius) { return new FakeColliderDesc("cylinder", { halfHeight, radius }); }
  static ball(radius) { return new FakeColliderDesc("ball", { radius }); }
}

class FakeBody {
  constructor(descriptor) {
    this.position = { ...descriptor.translation };
    this.nextPosition = { ...descriptor.translation };
    this.rotationValue = { x: 0, y: 0, z: 0, w: 1 };
    this.velocity = { x: 0, y: 0, z: 0 };
  }
  setNextKinematicTranslation(position) { this.nextPosition = { ...position }; }
  setTranslation(position) { this.position = { ...position }; this.nextPosition = { ...position }; }
  setRotation(rotation) { this.rotationValue = { ...rotation }; }
  setLinvel(velocity) { this.velocity = { ...velocity }; }
  translation() { return { ...this.position }; }
  rotation() { return { ...this.rotationValue }; }
  linvel() { return { ...this.velocity }; }
}

class FakeJoint {
  constructor(data) {
    this.data = data;
    this.motor = null;
    this.limits = null;
    this.contacts = false;
  }
  setLimits(minimum, maximum) { this.limits = [minimum, maximum]; }
  setContactsEnabled(enabled) { this.contacts = enabled; }
  configureMotorPosition(target, stiffness, damping) {
    this.motor = { target, stiffness, damping };
  }
  configureMotorVelocity(target, damping) {
    this.motor = { targetVelocity: target, damping };
  }
  configureMotor(target, targetVelocity, stiffness, damping) {
    this.motor = { target, targetVelocity, stiffness, damping };
  }
  angle() { return this.motor?.target ?? 0; }
}

class FakeWorld {
  constructor(gravity) {
    this.gravity = { ...gravity };
    this.bodies = new Set();
    this.colliders = new Set();
    this.joints = new Set();
    this.timestep = 1 / 60;
  }
  createRigidBody(descriptor) {
    const body = new FakeBody(descriptor);
    this.bodies.add(body);
    return body;
  }
  createCollider(descriptor, body) {
    const collider = { descriptor, body };
    this.colliders.add(collider);
    return collider;
  }
  removeRigidBody(body) {
    this.bodies.delete(body);
    for (const collider of Array.from(this.colliders)) {
      if (collider.body === body) this.colliders.delete(collider);
    }
  }
  createImpulseJoint(data, parent, child) {
    const joint = new FakeJoint(data);
    joint.parent = parent;
    joint.child = child;
    this.joints.add(joint);
    return joint;
  }
  removeImpulseJoint(joint) { this.joints.delete(joint); }
  step() {
    for (const body of this.bodies) body.position = { ...body.nextPosition };
  }
  intersectionPair() { return false; }
  free() {
    this.bodies.clear();
    this.colliders.clear();
    this.joints.clear();
  }
}

const JointData = {
  fixed(anchorA, frameA, anchorB, frameB) { return { type: "fixed", anchorA, frameA, anchorB, frameB }; },
  spherical(anchorA, anchorB) { return { type: "spherical", anchorA, anchorB }; },
  revolute(anchorA, anchorB, axis) { return { type: "revolute", anchorA, anchorB, axis }; },
  prismatic(anchorA, anchorB, axis) { return { type: "prismatic", anchorA, anchorB, axis }; }
};

const RAPIER = {
  World: FakeWorld,
  RigidBodyDesc: FakeRigidBodyDesc,
  ColliderDesc: FakeColliderDesc,
  JointData
};

const provider = createRapierArticulatedPhysicsProvider({
  rapier: RAPIER,
  gravity: { x: 0, y: -9.81, z: 0 }
});

assert.equal(provider.initialize(), "rapier-articulated");
provider.syncBodies([{
  id: "root",
  kind: "kinematic",
  collision: { shape: "capsule", halfHeight: 0.5, radius: 0.4 },
  transform: { position: { x: 0, y: 1, z: 0 } }
}]);
provider.syncArticulations([{
  id: "raptor-dynamics",
  rigId: "raptor-rig",
  bodies: [
    { id: "thigh-L-body", boneId: "thigh-L", kind: "dynamic" },
    { id: "shin-L-body", boneId: "shin-L", kind: "dynamic" }
  ],
  joints: [{
    id: "knee-L",
    parentBodyId: "thigh-L-body",
    childBodyId: "shin-L-body",
    childBoneId: "shin-L",
    type: "revolute",
    axis: { x: 1, y: 0, z: 0 },
    limits: { minimum: 0, maximum: 2.5 }
  }]
}]);
provider.submitJointMotorRequests([{
  id: "tick:1:knee-L",
  articulationId: "raptor-dynamics",
  jointId: "knee-L",
  targetPosition: 1,
  stiffness: 120,
  damping: 18
}]);
provider.step({ tickId: "tick:1", frame: 1, delta: 1 / 60 });

const frame = provider.getFrame();
assert.equal(frame.providerId, "rapier-articulated");
assert.equal(frame.constraintResults[0].constraintId, "knee-L");
assert.equal(frame.constraintResults[0].satisfied, true);
assert.equal(frame.jointResults[0].jointId, "knee-L");
assert.equal(frame.jointResults[0].targetError, 0);
assert.equal(frame.articulationResults[0].articulationId, "raptor-dynamics");
assert.doesNotThrow(() => structuredClone(frame));
assert.deepEqual(provider.getSnapshot().activeJointIds, ["knee-L"]);

provider.syncArticulations([]);
assert.deepEqual(provider.getSnapshot().activeJointIds, [], "retired articulation removes backend joints");
provider.reset();
assert.equal(provider.getSnapshot().activeJointIds.length, 0);
provider.dispose();

console.log("articulated Rapier provider test ok");
