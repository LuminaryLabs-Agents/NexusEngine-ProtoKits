# generic-seed-kit

Native NexusEngine Domain Service Kit for deterministic world-seed ownership and bounded named random streams.

## Domain

- Parent: `foundation`
- Domain path: `n:foundation:seed-stream`
- Canonical API: `engine.n.seedStream`
- Canonical factory: `createSeedKit(config?)`
- Compatibility factory: `createGenericSeedKit(NexusEngine?, config?)`
- Compatibility APIs: `engine.seedStream`, `engine.seedKit`, `engine.n.genericSeed`, `engine.genericSeed`, `engine.genericSeedKit`

NexusEngine owns hashing and the seeded-random primitive. This DSK owns a world seed, deterministic stream derivation, stream lifecycle, bounded stream count, draw accounting, and exact replay state.

## Public API

```text
engine.n.seedStream.getWorldSeed()
engine.n.seedStream.setWorldSeed(seed)
engine.n.seedStream.createStream(id, options?)
engine.n.seedStream.hasStream(id)
engine.n.seedStream.getStream(id?)
engine.n.seedStream.listStreams()
engine.n.seedStream.deleteStream(id)
engine.n.seedStream.nextUint32(id?)
engine.n.seedStream.next(id?)
engine.n.seedStream.range(id, min, max)
engine.n.seedStream.int(id, min, max)
engine.n.seedStream.bool(id, chance)
engine.n.seedStream.choose(id, items)
engine.n.seedStream.shuffle(id, items)
engine.n.seedStream.fork(parentId, scopeId, options?)
engine.n.seedStream.getState()
engine.n.seedStream.configure(config)
engine.n.seedStream.command(command)
engine.n.seedStream.getSnapshot()
engine.n.seedStream.loadSnapshot(snapshot)
engine.n.seedStream.reset(options?)
```

## Boundary

Owns seed identity and stream state. `getState`, `configure`, and `command` preserve the useful generic-factory control shape but reject unrelated catch-all commands. The DSK does not own procedural generation, loot tables, encounter policy, world content, simulation ticks, persistence transport, networking, rendering, input, or nondeterministic entropy.

## Promotion intent

Promote as stable `seed-kit`. Preserve `generic-seed-kit` factory and API aliases for source compatibility, but do not promote the old generic catch-all state runtime.
