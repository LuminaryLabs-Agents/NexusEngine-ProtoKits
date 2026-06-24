# Deploy Kit Manifest Template

```json
{
  "id": "example.entry-scene",
  "title": "Entry Scene",
  "kind": "scene-deploy-kit",
  "uses": [],
  "assetPacks": [],
  "entities": [],
  "sequences": [],
  "performanceProfile": {
    "targetFps": 60,
    "maxActiveScenes": 1,
    "maxActiveRooms": 4,
    "maxDynamicLights": 8,
    "maxFullSimEntities": 32,
    "maxDescriptors": 1000,
    "maxMemoryMb": 1024
  },
  "saveScope": {
    "profile": false,
    "world": true,
    "scene": true,
    "deltaOnly": true
  },
  "entry": {
    "spawnPoint": "default",
    "sequence": "intro"
  },
  "exits": []
}
```

## Rules

- The manifest configures kits; it does not own reusable gameplay behavior.
- `uses` declares kit IDs/tokens.
- `assetPacks` declares lazy-loadable asset groups.
- `entities` and `sequences` may be inline data or references.
- `performanceProfile` describes scene budget expectations.
- `saveScope` describes what state may persist.
