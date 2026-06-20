# render-descriptor-domain-kit

Boundary: `render-descriptor`.

Mental what-if loop:

```txt
What if a simulation domain needs to be drawn?
  The kit stores renderer-independent descriptors.
  Render adapters consume descriptors.
  Simulation domains never mutate meshes or Canvas state.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
material-domain-kit
lighting-domain-kit
renderer-adapter-domain-kit
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
NexusRealtime-scoped-domain-rpg-batch-01::render-descriptor-domain-kit::2026-06-20
```
