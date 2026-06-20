# terrain-height-domain-kit

Boundary: `terrain-height`.

Mental what-if loop:

```txt
What if an actor, prop, tree, or camera needs ground height?
  The host or another DSK asks heightAt(x, z).
  This kit samples deterministic terrain height.
  It records sample diagnostics and emits a sampled event.
  It does not draw terrain or move actors by itself.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
terrain-domain-kit
ground-contact-domain-kit
vegetation-placement-domain-kit
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
NexusRealtime-scoped-domain-rpg-batch-01::terrain-height-domain-kit::2026-06-20
```
