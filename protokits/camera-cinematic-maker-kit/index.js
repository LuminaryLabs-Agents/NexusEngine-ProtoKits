import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const CAMERA_CINEMATIC_MAKER_KIT_VERSION = "0.2.0";

export const DEFAULT_OBJECT_CAMERA_SHOTS = Object.freeze([
  { id: "turntable", mode: "orbit", distance: 3, duration: 4 },
  { id: "inspection-zoom", mode: "focus", distance: 1.25, duration: 2 },
  { id: "material-close-up", mode: "macro", distance: 0.65, duration: 2 },
  { id: "near-readability", mode: "readability", distance: 1.5, duration: 1 },
  { id: "mid-readability", mode: "readability", distance: 4, duration: 1 },
  { id: "far-readability", mode: "readability", distance: 10, duration: 1 },
  { id: "comparison-before-after", mode: "comparison", distance: 3, duration: 2 },
  { id: "pickup-reveal", mode: "reveal", distance: 2.4, duration: 1.25 }
]);

function createInitialState(options = {}) {
  return { version: CAMERA_CINEMATIC_MAKER_KIT_VERSION, shots: {}, sequences: {}, latestShotId: null, defaultTarget: options.defaultTarget ?? null };
}

function normalizeShot(shot = {}, index = 0) {
  const id = shot.id ?? `camera-shot-${index + 1}`;
  return {
    id,
    mode: shot.mode ?? "focus",
    targetId: shot.targetId ?? shot.objectId ?? null,
    distance: number(shot.distance, 3),
    duration: number(shot.duration, 1.5),
    fov: number(shot.fov, 42),
    easing: shot.easing ?? "smoothstep",
    framing: shot.framing ?? "center",
    purpose: shot.purpose ?? "inspection",
    metadata: clone(shot.metadata ?? {}),
    ...clone(shot),
    id
  };
}

export function createInspectionCameraDescriptor(input = {}) {
  const targetId = input.targetId ?? input.objectId ?? input.id ?? "object";
  const shots = asList(input.shots ?? DEFAULT_OBJECT_CAMERA_SHOTS).map((shot, index) => normalizeShot({ ...shot, targetId }, index));
  return {
    id: input.id ?? `${targetId}:inspection-camera`,
    targetId,
    proofId: input.proofId ?? null,
    packetRef: input.packetRef ?? input.proofPacket ?? null,
    shots,
    comparisonShots: shots.filter((shot) => shot.mode === "comparison"),
    readabilityShots: shots.filter((shot) => shot.mode === "readability")
  };
}

export function createCameraCinematicMakerKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const CameraCinematicState = resource(options.resourceName ?? "cameraCinematic.state");
  const CameraShotRegistered = event("cameraCinematic.shotRegistered");
  const CameraSequenceComposed = event("cameraCinematic.sequenceComposed");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "camera-cinematic-maker-kit",
    resources: { CameraCinematicState },
    events: { CameraShotRegistered, CameraSequenceComposed },
    provides: ["maker:camera-cinematic", "camera-shot-descriptors", "inspection-camera-descriptors", "comparison-camera-descriptors"],
    initWorld({ world }) { ensureResource(world, CameraCinematicState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, CameraCinematicState, () => createInitialState(options));
      const publish = (next) => { world.setResource(CameraCinematicState, next); return next; };
      engine[options.apiName ?? "cameraCinematic"] = {
        getState: state,
        registerShot(shot = {}) {
          const next = state();
          const normalized = normalizeShot(shot, Object.keys(next.shots).length);
          next.shots[normalized.id] = normalized;
          next.latestShotId = normalized.id;
          publish(next);
          world.emit(CameraShotRegistered, { shot: clone(normalized) });
          return clone(normalized);
        },
        createInspection(objectId, payload = {}) {
          const descriptor = createInspectionCameraDescriptor({ ...payload, objectId });
          const next = state();
          for (const shot of descriptor.shots) next.shots[shot.id] = shot;
          next.sequences[descriptor.id] = descriptor;
          next.latestShotId = descriptor.shots[0]?.id ?? null;
          publish(next);
          world.emit(CameraSequenceComposed, { sequence: clone(descriptor) });
          return clone(descriptor);
        },
        composeSequence(id, shots = [], payload = {}) {
          const next = state();
          const sequence = { id, shots: asList(shots).map((shot, index) => normalizeShot(shot, index)), ...payload };
          next.sequences[id] = sequence;
          for (const shot of sequence.shots) next.shots[shot.id] = shot;
          publish(next);
          world.emit(CameraSequenceComposed, { sequence: clone(sequence) });
          return clone(sequence);
        },
        latestShot() { return clone(state().shots[state().latestShotId] ?? null); },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: CAMERA_CINEMATIC_MAKER_KIT_VERSION, purpose: "Bounded camera descriptor container for turntable, inspection, material close-up, readability, comparison, and reveal shots." }
  });
}

export default createCameraCinematicMakerKit;
