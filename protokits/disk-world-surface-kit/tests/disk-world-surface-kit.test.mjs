import assert from "node:assert/strict";
import {
  DISK_WORLD_SURFACE_KIND,
  createDiskWorldSurface
} from "../surface.js";

const surface = createDiskWorldSurface({
  id: "test-disk",
  radius: 10000,
  edgeBlendWidth: 500,
  center: { x: 100, z: -200 }
});

assert.equal(surface.getDescriptor().kind, DISK_WORLD_SURFACE_KIND);
assert.equal(surface.contains({ x: 100, z: -200 }), true);
assert.equal(surface.contains({ x: 10101, z: -200 }), false);
assert.equal(surface.edgeMask({ x: 100, z: -200 }), 1);
assert.equal(surface.edgeMask({ x: 10100, z: -200 }), 0);
assert.ok(surface.edgeMask({ x: 9800, z: -200 }) > 0);
assert.ok(surface.edgeMask({ x: 9800, z: -200 }) < 1);

const normalized = surface.worldToDisk({ x: 5100, z: -200 });
assert.equal(normalized.x, 0.5);
assert.equal(normalized.z, 0);
assert.deepEqual(surface.diskToWorld(normalized), { x: 5100, z: -200 });

assert.equal(surface.classifyBounds({ minX: -50, maxX: 50, minZ: -50, maxZ: 50 }), "inside");
assert.equal(surface.classifyBounds({ minX: 9900, maxX: 10300, minZ: -400, maxZ: 0 }), "intersecting");
assert.equal(surface.classifyBounds({ minX: 12000, maxX: 12500, minZ: 0, maxZ: 500 }), "outside");

const clamped = surface.clampPoint({ x: 20100, z: -200 });
assert.ok(Math.abs(surface.distanceFromCenter(clamped) - 10000) < 1e-6);

const first = surface.getSnapshot();
surface.configure({ radius: 8000, edgeBlendWidth: 400 });
assert.equal(surface.getDescriptor().radius, 8000);
surface.loadSnapshot(first);
assert.deepEqual(surface.getSnapshot(), first);
surface.configure({ radius: 6000 });
surface.reset();
assert.deepEqual(surface.getSnapshot(), first);
assert.equal(surface.validate().ok, true);
assert.equal(JSON.parse(JSON.stringify(first)).descriptor.radius, 10000);

console.log("disk-world-surface-kit deterministic boundary tests passed.");
