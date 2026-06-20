# scan-affordance-domain-kit

Boundary: `scan-affordance`.

Mental what-if loop:

```txt
What if an object can be scanned?
  The kit owns scan target progress and completion events.
  It rejects missing scan targets with a reason.
  Objective, audio, and render descriptor domains compose the scan-complete event.
  It does not draw scan beams or mutate renderer objects.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
affordance-descriptor-domain-kit
spatial-interaction-domain-kit
objective-flow-domain-kit
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
NexusRealtime-scoped-domain-rpg-batch-01::scan-affordance-domain-kit::2026-06-20
```
