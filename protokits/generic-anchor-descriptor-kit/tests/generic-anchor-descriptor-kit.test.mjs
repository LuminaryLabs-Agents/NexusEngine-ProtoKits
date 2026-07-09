import assert from "node:assert/strict";
import * as NexusEngine from "nexusengine";
import { createGenericAnchorDescriptorKit, normalizeAnchorDescriptor } from "../index.js";

const normalized = normalizeAnchorDescriptor({ id: "a", x: 1, y: 2, tags: ["route-node"] });
assert.equal(normalized.position.x, 1);
assert.equal(normalized.tags[0], "route-node");

const engine = NexusEngine.createEngine({
  kits: [
    createGenericAnchorDescriptorKit(NexusEngine, {
      anchors: [
        { id: "anchor-0", groupId: "route", position: { x: 0, y: 0, z: 0 }, tags: ["start"] }
      ]
    })
  ]
});

assert.equal(engine.n.anchorDescriptors.getAnchors().length, 1);
assert.equal(engine.anchorDescriptors, engine.n.anchorDescriptors);
engine.n.anchorDescriptors.addAnchor({ id: "anchor-1", groupId: "route", position: { x: 10, y: 20, z: 0 }, tags: ["route-node"] });
engine.tick(1 / 60);
assert.equal(engine.n.anchorDescriptors.getAnchors("route").length, 2);
assert.equal(engine.n.anchorDescriptors.getAnchor("anchor-1").position.y, 20);
engine.n.anchorDescriptors.removeAnchors(["anchor-0"]);
engine.tick(1 / 60);
assert.equal(engine.n.anchorDescriptors.getAnchors().length, 1);

const snapshot = engine.n.anchorDescriptors.getSnapshot();
assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot);
engine.n.anchorDescriptors.reset({ reason: "test" });
assert.equal(engine.n.anchorDescriptors.getAnchors().length, 1, "reset restores configured anchors");
engine.n.anchorDescriptors.loadSnapshot(snapshot);
assert.deepEqual(engine.n.anchorDescriptors.getSnapshot(), snapshot);
assert.throws(() => engine.n.anchorDescriptors.loadSnapshot({ ...snapshot, version: "0.1.0" }), /Unsupported/);

console.log("generic anchor descriptor kit tests passed");
