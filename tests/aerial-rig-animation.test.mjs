import assert from 'node:assert/strict';

import {
  ARTICULATED_RIG_DESCRIPTOR_KIT_VERSION,
  PROCEDURAL_WING_FLAP_KIT_VERSION,
  FLIGHT_POSE_DRIVER_KIT_VERSION,
  RIG_ANIMATION_DESCRIPTOR_KIT_VERSION,
  createArticulatedRigDescriptorKit,
  createProceduralWingFlapKit,
  createFlightPoseDriverKit,
  createRigAnimationDescriptorKit
} from '../protokits/aerial-flight-kits/rig.js';

const NexusRealtime = {
  defineResource: (name) => ({ kind: 'resource', name }),
  defineEvent: (name) => ({ kind: 'event', name }),
  defineRuntimeKit: (kit) => kit
};

const rig = createArticulatedRigDescriptorKit(NexusRealtime, { wingSpan: 9 });
const flap = createProceduralWingFlapKit(NexusRealtime, { tipLag: 0.58 });
const pose = createFlightPoseDriverKit(NexusRealtime, {});
const anim = createRigAnimationDescriptorKit(NexusRealtime, {});

assert.equal(typeof ARTICULATED_RIG_DESCRIPTOR_KIT_VERSION, 'string');
assert.equal(typeof PROCEDURAL_WING_FLAP_KIT_VERSION, 'string');
assert.equal(typeof FLIGHT_POSE_DRIVER_KIT_VERSION, 'string');
assert.equal(typeof RIG_ANIMATION_DESCRIPTOR_KIT_VERSION, 'string');
assert.ok(rig.provides.includes('rig:definition'));
assert.ok(flap.provides.includes('rig:wing-flap'));
assert.ok(pose.provides.includes('rig:flight-pose'));
assert.ok(anim.provides.includes('render:rig-animation-descriptor'));
assert.equal(rig.systems[0].name, 'articulated-rig-descriptor-system');
assert.equal(flap.systems[0].name, 'procedural-wing-flap-system');
assert.equal(pose.systems[0].name, 'flight-pose-driver-system');
assert.equal(anim.systems[0].name, 'rig-animation-descriptor-system');

console.log('aerial-rig-animation ok');
