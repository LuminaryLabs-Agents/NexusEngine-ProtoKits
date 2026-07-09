# Async Domain Load Kit

Bounded async loading domain state for NexusEngine ProtoKits.

This kit owns deterministic load queue state, readiness, progress, and metrics. It does not own browser `fetch`, `import()`, GLTF parsing, WebGL, Three.js, DOM, or GPU upload. Hosts and renderer adapters perform actual IO and report progress back through the engine API.

## Domain

```txt
async load state
queued work
running work
progress metrics
failure/retry records
host-adapter handoff
```

## Services

```js
engine.asyncDomainLoad.queue(task)
engine.asyncDomainLoad.claimNext(filter)
engine.asyncDomainLoad.progress(id, payload)
engine.asyncDomainLoad.complete(id, result)
engine.asyncDomainLoad.fail(id, error)
engine.asyncDomainLoad.snapshot()
engine.asyncDomainLoad.summarize()
```

## Provides

```txt
async-domain-load
load-queue-state
load-metrics
load-readiness
```

## Rule

The kit defines the domain. The host adapter performs IO.
