# quest-domain-kit

Boundary: `quest`.

Mental what-if loop:

```txt
What if an open-world route needs authored progression?
  The kit owns quest records and quest step state.
  Domain events or public APIs advance quest progress.
  It emits quest advanced / completed / rejected events.
  Sequences own the player-facing pacing and copy.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
objective-flow-domain-kit
sequence-prompt-domain-kit
dialogue-domain-kit
```

Smoke environments:

```txt
headless-empty
ember-rail
tideglass-salvage
echo-lock
restart-reset
```

Smoke signature:

```txt
NexusRealtime-scoped-domain-rpg-batch-01::quest-domain-kit::2026-06-20
```
