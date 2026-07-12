import assert from "node:assert/strict";
import { createRapierPhysicsProvider } from "../index.js";

let lastWorld = null;

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
  constructor(desc) {
    this.position = { ...desc.translation };
    this.nextPosition = { ...desc.translation };
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

class FakeWorld {
  constructor(gravity) {
    this.gravity = { ...gravity };
    this.bodies = new Set();
    this.colliders = new Set();
    this.removedBodies = 0;
    this.timestep = 1 / 60;
    lastWorld = this;
  }
  createRigidBody(desc) {
    const body = new FakeBody(desc);
    this.bodies.add(body);
    return body;
  }
  createCollider(desc, body) {
    const collider = { desc, body };
    this.colliders.add(collider);
    return collider;
  }
  removeRigidBody(body) {
    if (this.bodies.delete(body)) this.removedBodies += 1;
    for (const collider of Array.from(this.colliders)) {
      if (collider.body === body) this.colliders.delete(collider);
    }
  }
  step() {
    for (const body of this.bodies) body.position = { ...body.nextPosition };
  }
  intersectionPair(left, right) {
    const a = left.body.position;
    const b = right.body.position;
    const radius = Number(left.desc.radius ?? 0.5) + Number(right.desc.radius ?? 0.5);
    return Math.hypot(a.x - b.x, a.z - b.z) <= radius;
  }
  free() {
    this.bodies.clear();
    this.colliders.clear();
  }
}

const RAPIER = {
  World: FakeWorld,
  RigidBodyDesc: FakeRigidBodyDesc,
  ColliderDesc: FakeColliderDesc
};

const provider = createRapierPhysicsProvider({
  rapier: RAPIER,
  gravity: { x: 0, y: -9.81, z: 0 }
});

assert.equal(provider.initialize(), "rapier");
provider.syncBodies([{
  id: "player",
  kind: "kinematic",
  collision: { shape: "capsule", halfHeight: 0.5, radius: 0.4 },
  transform: { position: { x: 0, y: 1, z: 0 } },
  tags: ["player"]
}]);
provider.syncColliders([
  { id: "tree-a", shape: "ball", radius: 0.7, x: 0.5, y: 1, z: 0, tags: ["fatal-obstacle"] },
  { id: "tree-b", shape: "ball", radius: 0.7, x: 20, y: 1, z: 0 }
]);
provider.submitMotionRequests([{
  id: "move-1",
  bodyId: "player",
  position: { x: 0, y: 1, z: 0 }
}]);
provider.step({ tickId: "tick:1", frame: 1, delta: 1 / 60 });

const first = provider.getFrame();
assert.equal(first.stepId, "tick:1");
assert.equal(first.providerId, "rapier");
assert.equal(first.bodyResults[0].bodyId, "player");
assert.equal(first.contacts.length, 1, "contact is normalized");
assert.equal(first.contacts[0].colliderId, "tree-a");
assert.deepEqual(first.contacts[0].tags, ["fatal-obstacle", "player"]);
assert.doesNotThrow(() => structuredClone(first));
assert.equal(Object.values(first).some((value) => value instanceof FakeBody || value instanceof FakeWorld), false, "Rapier objects do not leak");

const worldBeforeRetirement = lastWorld;
provider.syncColliders([{ id: "tree-b", shape: "ball", radius: 0.7, x: 20, y: 1, z: 0 }]);
assert.equal(worldBeforeRetirement.removedBodies, 1, "missing fixed collider body is retired");
provider.step({ tickId: "tick:2", frame: 2, delta: 1 / 60 });
assert.equal(provider.getFrame().contacts.length, 0, "retired collider cannot create a ghost contact");
assert.equal(provider.getSnapshot().colliders.length, 1);

provider.reset();
assert.equal(provider.getSnapshot().stepCount, 0);
provider.dispose();
assert.equal(provider.getSnapshot().disposed, true);

console.log("rapier physics provider test ok");
