# Kit Load Plan Kit

A bounded DSM-shaped ProtoKit for runtime/module load plans.

It does not call `import()` and does not own browser IO. Experiment loaders and deploy adapters perform imports one by one, then report status and metrics through this kit.

## Services

```js
engine.kitLoadPlan.setPlan(entries)
engine.kitLoadPlan.register(entry)
engine.kitLoadPlan.mark(id, status, payload)
engine.kitLoadPlan.getNext(status)
engine.kitLoadPlan.summarize()
engine.kitLoadPlan.snapshot()
```

## Provides

```txt
kit-load-plan
module-load-plan
boot-load-metrics
loader-progress-descriptors
```

## Entry shape

```js
{
  id: "terrain-sampler-kit",
  label: "Terrain sampler",
  specifier: "https://cdn.../protokits/terrain-sampler-kit/index.js",
  kind: "protokit",
  phase: "kits",
  required: true
}
```

Use this in experiments when the route JS should only provide config and hookup while the loader reports detailed per-kit boot metrics.
