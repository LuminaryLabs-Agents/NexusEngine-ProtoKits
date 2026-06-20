export const AUDIO_FEEDBACK_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createAudioFeedbackDomainKit requires NexusRealtime.${key}.`);
  }
}

function createState(config = {}) {
  return { version: AUDIO_FEEDBACK_DOMAIN_KIT_VERSION, id: config.stateId ?? "audio-feedback-domain", domain: "audio-feedback", rules: asArray(config.rules), descriptors: [], lastDescriptor: null };
}

export function createAudioFeedbackDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const AudioFeedbackState = defineResource(config.resourceName ?? "audioFeedbackDomain.state");
  const AudioFeedbackRequested = defineEvent("audioFeedback.requested");
  const AudioFeedbackDescribed = defineEvent("audioFeedback.described");

  function system(world) {
    let state = world.getResource(AudioFeedbackState) ?? createState(config);
    for (const event of world.readEvents(AudioFeedbackRequested)) {
      const descriptor = { id: String(event.id ?? `audio-${state.descriptors.length + 1}`), cue: String(event.cue ?? event.type ?? "event"), intensity: Number(event.intensity ?? 1), position: event.position ? clone(event.position) : null, tags: asArray(event.tags).map(String) };
      state = { ...state, descriptors: [...state.descriptors, descriptor], lastDescriptor: descriptor };
      world.emit(AudioFeedbackDescribed, descriptor);
    }
    world.setResource(AudioFeedbackState, state);
  }

  return defineRuntimeKit({
    id: config.kitId ?? "audio-feedback-domain-kit",
    provides: ["n:audio-feedback", "audio:descriptors"],
    resources: { AudioFeedbackState },
    events: { AudioFeedbackRequested, AudioFeedbackDescribed },
    systems: [{ phase: config.phase ?? "feedback", name: "audioFeedbackDomainSystem", system }],
    initWorld({ world }) { world.setResource(AudioFeedbackState, createState(config)); },
    install({ engine, world }) {
      engine.audioFeedbackDomain = {
        request(cue, payload = {}) { world.emit(AudioFeedbackRequested, { cue, ...payload }); return world.getResource(AudioFeedbackState); },
        getState() { return clone(world.getResource(AudioFeedbackState)); }
      };
    },
    metadata: { domain: "audio-feedback", parentDomain: "feedback", scope: "large-domain", extendsBase: "DomainServiceKit", composes: ["event surface", "render-descriptor-domain-kit", "audio-adapter-domain-kit"], ownsLoop: false, purpose: "Maps domain events to renderer/audio-adapter-independent audio descriptors." }
  });
}

export default createAudioFeedbackDomainKit;
