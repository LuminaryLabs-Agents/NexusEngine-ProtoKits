import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION = "0.2.0";

const DEFAULT_OBJECT_SIGNALS = Object.freeze({
  hover: { kind: "outline", color: "#8ee8ff", intensity: 0.75, duration: 0.15 },
  inspect: { kind: "focus-ring", color: "#ffffff", intensity: 0.9, duration: 0.4 },
  press: { kind: "depression-pulse", color: "#ff7070", intensity: 0.8, duration: 0.18 },
  pickup: { kind: "shimmer", color: "#ffd86b", intensity: 0.88, duration: 0.35 },
  invalid: { kind: "reject-bump", color: "#ff3b3b", intensity: 0.65, duration: 0.22 },
  comparison: { kind: "split-highlight", color: "#b6ff72", intensity: 0.62, duration: 0.5 }
});

function createInitialState(options = {}) {
  return { version: DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION, signals: {}, byObjectId: {}, templates: { ...DEFAULT_OBJECT_SIGNALS, ...(options.templates ?? {}) } };
}

function normalizeSignal(signal = {}, index = 0, templates = DEFAULT_OBJECT_SIGNALS) {
  const action = signal.action ?? signal.type ?? "hover";
  const template = templates[action] ?? {};
  const id = signal.id ?? `${signal.objectId ?? "object"}:${action}:${index + 1}`;
  return {
    id,
    objectId: signal.objectId ?? signal.targetId ?? null,
    action,
    kind: signal.kind ?? template.kind ?? "marker",
    color: signal.color ?? template.color ?? "#ffffff",
    intensity: number(signal.intensity, number(template.intensity, 0.5)),
    duration: number(signal.duration, number(template.duration, 0.25)),
    active: signal.active !== false,
    layer: signal.layer ?? "world-ui",
    metadata: clone(signal.metadata ?? {}),
    ...clone(signal),
    id
  };
}

export function createDiegeticFeedbackSignalKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const DiegeticFeedbackState = resource(options.resourceName ?? "diegeticFeedback.state");
  const FeedbackSignalEmitted = event("diegeticFeedback.signalEmitted");
  const FeedbackSignalCleared = event("diegeticFeedback.signalCleared");

  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? options.kitId ?? "diegetic-feedback-signal-kit",
    resources: { DiegeticFeedbackState },
    events: { FeedbackSignalEmitted, FeedbackSignalCleared },
    provides: ["feedback:diegetic", "render:world-signals", "highlight-descriptors", "world-cue-descriptors"],
    initWorld({ world }) { ensureResource(world, DiegeticFeedbackState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, DiegeticFeedbackState, () => createInitialState(options));
      const publish = (next) => { world.setResource(DiegeticFeedbackState, next); return next; };
      engine[options.apiName ?? "diegeticFeedback"] = {
        getState: state,
        emitSignal(signal = {}) {
          const next = state();
          const normalized = normalizeSignal(signal, Object.keys(next.signals).length, next.templates);
          next.signals[normalized.id] = normalized;
          if (normalized.objectId) (next.byObjectId[normalized.objectId] ??= []).push(normalized.id);
          publish(next);
          world.emit(FeedbackSignalEmitted, { signal: clone(normalized) });
          return clone(normalized);
        },
        objectCue(objectId, action, payload = {}) { return this.emitSignal({ objectId, action, ...payload }); },
        hover(objectId, payload = {}) { return this.objectCue(objectId, "hover", payload); },
        inspect(objectId, payload = {}) { return this.objectCue(objectId, "inspect", payload); },
        press(objectId, payload = {}) { return this.objectCue(objectId, "press", payload); },
        pickup(objectId, payload = {}) { return this.objectCue(objectId, "pickup", payload); },
        invalid(objectId, payload = {}) { return this.objectCue(objectId, "invalid", payload); },
        comparison(objectId, payload = {}) { return this.objectCue(objectId, "comparison", payload); },
        clearObject(objectId) {
          const next = state();
          const ids = asList(next.byObjectId[objectId]);
          for (const id of ids) delete next.signals[id];
          delete next.byObjectId[objectId];
          publish(next);
          world.emit(FeedbackSignalCleared, { objectId, ids });
          return ids;
        },
        snapshot() { return clone(state()); }
      };
    },
    metadata: { version: DIEGETIC_FEEDBACK_SIGNAL_KIT_VERSION, purpose: "Bounded world-feedback descriptor container for object hover, inspect, press, pickup, invalid, and comparison cues." }
  });
}

export default createDiegeticFeedbackSignalKit;
