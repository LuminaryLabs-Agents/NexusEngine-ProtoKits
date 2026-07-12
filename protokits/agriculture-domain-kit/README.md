# agriculture-domain-kit

Renderer-agnostic `n:production:agriculture` Domain Service Kit for land, soil, cultivation, watering, growth, harvest, and perennial crops.

## Boundary

Owns:

- farm plots and field state
- soil preparation, moisture, fertility, and soil type
- crop definitions and planted crop instances
- watering and growth resolution
- deterministic harvest yields
- annual and perennial crop lifecycle
- agriculture descriptors, snapshots, reset, replay, and duplicate-operation safety

Does not own:

- player inventory or item balances
- weather generation or the calendar
- wild foraging, fishing, cooking, crafting, or construction
- renderer objects, DOM, Canvas, WebGL, Three.js, audio, or storage transport

`n:production` is a catalog family, not an executable parent kit. The installed authority is `n:production:agriculture`.

## Services

```txt
engine.n.agriculture.land
engine.n.agriculture.soil
engine.n.agriculture.cultivation
engine.n.agriculture.water
engine.n.agriculture.growth
engine.n.agriculture.harvest
engine.n.agriculture.perennials
```

## Install

```js
import * as NexusEngine from "nexusengine";
import { createAgricultureDomainKit } from "@luminarylabs/nexusengine-protokits/agriculture-domain-kit";

const engine = NexusEngine.createEngine({
  kits: [
    NexusEngine.createCoreTransactionLedgerKit(),
    createAgricultureDomainKit(NexusEngine, {
      growthMode: "daily",
      plots: [{ id: "field-1", soilType: "loam" }],
      cropDefinitions: {
        wheat: {
          id: "wheat",
          seedItemId: "wheat-seed",
          harvestItemId: "wheat",
          growthDays: 3,
          stageCount: 4,
          yieldMin: 2,
          yieldMax: 5
        }
      }
    })
  ]
});
```

## Resource boundary

Plant and harvest plans expose `resourceChanges`. A product transaction coordinator applies those changes through its inventory/resource authority, then commits the agriculture plan. Agriculture never stores inventory balances.

## Validation

The test suite proves tropical and temperate configurations, continuous and day-resolved growth, annual and perennial harvest behavior, snapshot round trips, deterministic replay, duplicate operation rejection, and renderer-neutral plot descriptors.
