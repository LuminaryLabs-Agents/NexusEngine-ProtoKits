import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const AUDIO_EVENT_FEEDBACK_MAKER_KIT_VERSION = "0.2.0";

export const DEFAULT_OBJECT_AUDIO_CUES = Object.freeze([
  { id: "button-click", event: "press", family: "button", gain: 0.8, pitch: 1.0, envelope: "short" },
  { id: "coin-pickup", event: "pickup", family: "coin", gain: 0.7, pitch: 1.25, envelope: "spark" },
  { id: "crate-thud", event: "drop", family: "crate", gain: 0.75, pitch: 0.72, envelope: "thud" },
  { id: "potion-glass-clink", event: "pickup", family: "potion", gain: 0.55, pitch: 1.15, envelope: "glass" },
  { id: "liquid-slosh", event: "move", family: "liquid", gain: 0.42, pitch: 0.86, envelope: "soft" },
  { id: "hover-tick", event: "hover", family: "ui", gain: 0.28, pitch: 1.4, envelope: "tick" },
  { id: "invalid-action-bump", event: "invalid", family: "ui", gain: 0.38, pitch: 0.62, envelope: "bump" },
  { id: "activation-chime", event: "activate", family: "magic", gain: 0.64, pitch: 1.1, envelope: "chime" }
]);

function createInitialState(options = {}) {
  return { version: AUDIO_EVENT_FEEDBACK_MAKER_KIT_VERSION, cues: {}, events: [], lastCueId: null, masterGain: number(options.masterGain, 1) };
}

function normalizeCue(cue = {}, index = 0) {
  const id = cue.id ?? `${cue.family ?? "object"}-${cue.event ?? "cue"}-${index + 1}`;
  return { id, event: cue.event ?? "activate", family: cue.family ?? "object", gain: number(cue.gain, 0.5), pitch: number(cue.pitch, 1), envelope: cue.envelope ?? "short", spatial: cue.spatial ?? true, metadata: clone(cue.metadata ?? {}), ...clone(cue), id };
}

export function createObjectAudioEventDescriptor(input = {}) {
  const cues = asList(input.cues ?? DEFAULT_OBJECT_AUDIO_CUES).map(normalizeCue);
  return {
    id: input.id ?? `${input.objectId ?? input.family ?? "object"}:audio-events`,
    objectId: input.objectId ?? null,
    packetRef: input.packetRef ?? input.proofPacket ?? null,
    cues,
    byEvent: cues.reduce((map, cue) => { (map[cue.event] ??= []).push(cue.id); return map; }, {})
  };
}

export function createAudioEventFeedbackMakerKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const AudioFeedbackState = resource(options.resourceName ?? "audioFeedback.state");
  const AudioCueRegistered = event("audioFeedback.cueRegistered");
  const AudioCueTriggered = event("audioFeedback.cueTriggered");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "audio-event-feedback-maker-kit",
    resources: { AudioFeedbackState },
    events: { AudioCueRegistered, AudioCueTriggered },
    provides: ["maker:audio-event-feedback", "audio-cue-descriptors", "object-audio-event-descriptors"],
    initWorld({ world }) {
      const state = createInitialState(options);
      for (const cue of asList(options.defaultCues ?? DEFAULT_OBJECT_AUDIO_CUES).map(normalizeCue)) state.cues[cue.id] = cue;
      world.setResource(AudioFeedbackState, state);
    },
    install({ engine, world }) {
      const state = () => ensureResource(world, AudioFeedbackState, () => createInitialState(options));
      const publish = (next) => { world.setResource(AudioFeedbackState, next); return next; };
      engine[options.apiName ?? "audioFeedback"] = {
        getState: state,
        registerCue(cue = {}) {
          const next = state();
          const normalized = normalizeCue(cue, Object.keys(next.cues).length);
          next.cues[normalized.id] = normalized;
          publish(next);
          world.emit(AudioCueRegistered, { cue: clone(normalized) });
          return clone(normalized);
        },
        registerDescriptor(descriptor = {}) { return asList(descriptor.cues).map((cue) => this.registerCue(cue)); },
        trigger(eventName, payload = {}) {
          const next = state();
          const cues = Object.values(next.cues).filter((cue) => cue.event === eventName || cue.id === eventName);
          const events = cues.map((cue) => ({ cueId: cue.id, event: eventName, objectId: payload.objectId ?? null, gain: number(payload.gain, 1) * number(cue.gain, 1) * number(next.masterGain, 1), pitch: number(payload.pitch, cue.pitch), spatial: cue.spatial, position: payload.position ?? null, metadata: { ...(cue.metadata ?? {}), ...(payload.metadata ?? {}) } }));
          next.events.push(...events);
          next.events = next.events.slice(-128);
          next.lastCueId = events.at(-1)?.cueId ?? next.lastCueId;
          publish(next);
          for (const audioEvent of events) world.emit(AudioCueTriggered, audioEvent);
          return events.map(clone);
        },
        createDescriptor: createObjectAudioEventDescriptor,
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: AUDIO_EVENT_FEEDBACK_MAKER_KIT_VERSION, purpose: "Bounded audio cue descriptor container for object press, pickup, drop, hover, invalid, activation, glass, and liquid cues." }
  });
}

export default createAudioEventFeedbackMakerKit;
