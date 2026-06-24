import assert from "node:assert/strict";
import {
  DEFAULT_PLATFORMER_LEVEL,
  createPlatformerAvatarDomainKit,
  createPlatformerLevelDomainKit,
  createPlatformerPhysicsSystemKit,
  createSpatialGameBoardDomainKit,
  createVrPlatformerMaximumFeatureKits,
  simulatePlatformerStep
} from "../protokits/vr-platformer-kit-suite/index.js";
import { createStereoscopicRenderDomainKit } from "../protokits/stereoscopic-render-domain-kit/index.js";

const avatar = {
  id: "player",
  mode: "grounded",
  position: { x: 1.5, y: 1 },
  previousPosition: { x: 1.5, y: 1 },
  velocity: { x: 0, y: 0 },
  size: { x: 0.72, y: 1.1 },
  facing: 1,
  grounded: true,
  moveAxis: 1,
  jumpQueued: true,
  coyoteTimer: 0.1,
  jumpBuffer: 0.1
};

const next = simulatePlatformerStep(avatar, DEFAULT_PLATFORMER_LEVEL, 1 / 60);
assert.ok(next.position.x > avatar.position.x, "avatar should advance when move axis is positive");
assert.ok(next.velocity.y > 0, "jump buffer plus coyote timer should create upward velocity");

const levelKit = createPlatformerLevelDomainKit({}, {});
const avatarKit = createPlatformerAvatarDomainKit({}, {});
const physicsKit = createPlatformerPhysicsSystemKit({}, {});
const boardKit = createSpatialGameBoardDomainKit({}, {});
const stereoKit = createStereoscopicRenderDomainKit({}, { requires: [] });

assert.equal(levelKit.id, "platformer-level-domain-kit");
assert.equal(avatarKit.id, "platformer-avatar-domain-kit");
assert.equal(physicsKit.id, "platformer-physics-system-kit");
assert.equal(boardKit.id, "spatial-game-board-domain-kit");
assert.equal(stereoKit.id, "stereoscopic-render-domain-kit");
assert.ok(boardKit.provides.includes("spatial:game-board"));
assert.ok(stereoKit.provides.includes("xr:eye-view-descriptors"));

const kits = createVrPlatformerMaximumFeatureKits({}, {});
assert.equal(kits.length, 16, "maximum feature suite should compose sixteen VR platformer kits before stereo is added by the XR render stack");
assert.ok(kits.some((kit) => kit.id === "xr-platformer-render-adapter-kit"));
assert.ok(kits.some((kit) => kit.id === "xr-comfort-domain-kit"));

console.log("VR platformer kit suite smoke passed.");
