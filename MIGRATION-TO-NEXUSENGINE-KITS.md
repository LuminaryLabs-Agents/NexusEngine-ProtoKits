# Migration To NexusEngine Kits

Stable ProtoKits now promote into the official first-party kit catalog:

```txt
Repo: LuminaryLabs-Dev/NexusEngine-Kits
Package: @luminarylabs/nexusengine-kits
Branch: main
```

This repository remains the incubation zone.

Use:

```txt
docs/PROMOTION-TO-NEXUSENGINE-KITS.md
```

for the promotion rules, destination structure, and first migration targets.

## Rule

```txt
Experiment
-> ProtoKit
-> validated ProtoKit
-> NexusEngine-Kits official kit
-> NexusEngine runtime primitive only if the runtime contract itself must change
```

Do not delete existing ProtoKit import paths when a kit promotes. Keep compatibility notes or bridge exports until downstream apps have migrated.
