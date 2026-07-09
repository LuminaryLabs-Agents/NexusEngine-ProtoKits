import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource, number } from "../protokit-core/index.js";

export const OBJAVERSE_METADATA_STREAM_KIT_VERSION = "0.1.0";

function time(world) { return number(world?.__nexusClock?.elapsed, 0); }
function id(value, fallback) { return String(value ?? fallback).trim() || fallback; }

export function createObjaverseMetadataStreamState(options = {}) {
  const streams = Object.fromEntries(asList(options.streams).map((stream, index) => {
    const streamId = id(stream.id, `metadata-stream-${index + 1}`);
    return [streamId, { id: streamId, source: stream.source ?? null, status: stream.status ?? "queued", chunks: asList(stream.chunks), records: asList(stream.records), cursor: stream.cursor ?? null, error: null, metadata: clone(stream.metadata ?? {}) }];
  }));
  return { version: OBJAVERSE_METADATA_STREAM_KIT_VERSION, streams, history: [] };
}

export function summarizeObjaverseMetadataStreams(state = {}) {
  const streams = Object.values(state.streams ?? {});
  return { total: streams.length, queued: streams.filter((s) => s.status === "queued").length, running: streams.filter((s) => s.status === "running").length, done: streams.filter((s) => s.status === "done").length, failed: streams.filter((s) => s.status === "failed").length, records: streams.reduce((sum, s) => sum + asList(s.records).length, 0), chunks: streams.reduce((sum, s) => sum + asList(s.chunks).length, 0) };
}

export function createObjaverseMetadataStreamKit(nexusEngine = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusEngine);
  const State = resource(options.resourceName ?? "objaverseMetadataStream.state");
  const Updated = event("objaverseMetadataStream.updated");
  const initial = () => createObjaverseMetadataStreamState(options);
  return defineInjectedRuntimeKit(nexusEngine, {
    id: options.id ?? "objaverse-metadata-stream-kit",
    resources: { State },
    events: { Updated },
    provides: ["objaverse:metadata-stream", "metadata:streaming", "metadata:stream-metrics"],
    initWorld({ world }) { ensureResource(world, State, initial); },
    install({ engine, world }) {
      const state = () => ensureResource(world, State, initial);
      const publish = (next, evt) => { next.history = evt ? [evt, ...(next.history ?? [])].slice(0, 64) : next.history; world.setResource(State, next); world.emit?.(Updated, { event: clone(evt), summary: summarizeObjaverseMetadataStreams(next), state: clone(next) }); return clone(next); };
      const api = {
        getState: state,
        snapshot: () => clone(state()),
        summarize: () => summarizeObjaverseMetadataStreams(state()),
        requestStream(stream = {}) {
          const next = state();
          const streamId = id(stream.id, `metadata-stream-${Object.keys(next.streams).length + 1}`);
          next.streams[streamId] = { id: streamId, source: stream.source ?? null, status: "queued", chunks: [], records: [], cursor: stream.cursor ?? null, error: null, metadata: clone(stream.metadata ?? {}) };
          return publish(next, { at: time(world), type: "requested", streamId });
        },
        claimNext() {
          const next = state();
          const stream = Object.values(next.streams).find((entry) => entry.status === "queued");
          if (!stream) return null;
          stream.status = "running";
          stream.startedAt = time(world);
          publish(next, { at: time(world), type: "started", streamId: stream.id });
          return clone(stream);
        },
        appendChunk(streamId, chunk = {}) {
          const next = state();
          const stream = next.streams[streamId];
          if (!stream) throw new Error(`Unknown metadata stream: ${streamId}`);
          stream.status = "running";
          stream.chunks.push(clone(chunk));
          stream.records.push(...asList(chunk.records ?? chunk.assets ?? chunk.items));
          stream.cursor = chunk.cursor ?? stream.cursor;
          return publish(next, { at: time(world), type: "chunk", streamId, records: asList(chunk.records ?? chunk.assets ?? chunk.items).length });
        },
        completeStream(streamId, payload = {}) {
          const next = state();
          const stream = next.streams[streamId];
          if (!stream) throw new Error(`Unknown metadata stream: ${streamId}`);
          stream.status = "done";
          stream.endedAt = time(world);
          stream.metadata = { ...stream.metadata, ...(payload.metadata ?? {}) };
          return publish(next, { at: time(world), type: "done", streamId });
        },
        failStream(streamId, error) {
          const next = state();
          const stream = next.streams[streamId];
          if (!stream) throw new Error(`Unknown metadata stream: ${streamId}`);
          stream.status = "failed";
          stream.error = String(error?.message ?? error);
          stream.endedAt = time(world);
          return publish(next, { at: time(world), type: "failed", streamId, error: stream.error });
        },
        listRecords() { return Object.values(state().streams ?? {}).flatMap((stream) => asList(stream.records)).map(clone); },
        reset() { world.setResource(State, initial()); return this.snapshot(); }
      };
      engine.objaverseMetadataStream = api;
      engine.n ??= {};
      engine.n.objaverseMetadataStream = api;
    },
    metadata: { version: OBJAVERSE_METADATA_STREAM_KIT_VERSION, purpose: "Async metadata stream state for host-provided Objaverse catalog chunks." }
  });
}

export default createObjaverseMetadataStreamKit;
