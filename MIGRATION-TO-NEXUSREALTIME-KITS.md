# Migration To NexusRealtime Kits

Stable ProtoKits now promote into the official first-party kit catalog:

```txt
Repo: LuminaryLabs-Dev/NexusRealitime-Kits
Package: @luminarylabs/nexusrealtime-kits
Branch: main
```

This repository remains the incubation zone.

Use:

```txt
docs/PROMOTION-TO-NEXUSREALTIME-KITS.md
```

for the promotion rules, destination structure, and first migration targets.

## Rule

```txt
Experiment
-> ProtoKit
-> validated ProtoKit
-> NexusRealtime-Kits official kit
-> NexusRealtime runtime primitive only if the runtime contract itself must change
```

Do not delete existing ProtoKit import paths when a kit promotes. Keep compatibility notes or bridge exports until downstream apps have migrated.
