# Promotion To NexusRealtime Kits

`NexusRealtime-ProtoKits` remains the incubation repo.

Stable reusable kits now promote into:

```txt
LuminaryLabs-Dev/NexusRealitime-Kits
package: @luminarylabs/nexusrealtime-kits
branch: main
```

Do not promote stable gameplay/domain kits directly into `LuminaryLabs-Dev/NexusRealtime` unless the runtime contract itself must change.

## Promotion Ladder

```txt
Experiment
-> ProtoKit
-> validated ProtoKit
-> NexusRealtime-Kits official kit
-> NexusRealtime runtime primitive only if necessary
```

## What Must Be True Before Promotion

A ProtoKit can move into NexusRealtime Kits when it has:

- clear domain ownership
- stable kit name
- reusable behavior beyond one game
- deterministic state where state matters
- renderer-agnostic runtime behavior
- README or domain docs
- install example
- headless smoke or validation plan
- clean resources/events/systems
- known relationship to domain bundles

## Destination Shape

Each promoted kit should eventually land as:

```txt
kits/<domain>/<kit-name>/
├─ README.md
├─ kit.json
├─ package.json
├─ index.js
├─ smoke.test.mjs
└─ examples/
   ├─ headless.js
   └─ browser-cdn.html
```

## Install Shapes In The Kits Repo

```txt
one kit      -> installer.installKit(engine, "kit-id")
one domain   -> installer.installDomain(engine, "domain-id")
one bundle   -> installer.installBundle(engine, "bundle-id")
all kits     -> installer.installAll(engine)
```

## ProtoKits Compatibility

Do not delete old ProtoKit paths immediately. Prefer a migration note or bridge export after the official kit is stable.

Example:

```txt
Old: @luminarylabs/nexusrealtime-protokits/damage-health-kit
New: @luminarylabs/nexusrealtime-kits/damage-health-kit
```

## First Migration Targets

Start with atomic services:

```txt
completion-ledger-kit
spatial-interaction-kit
objective-bridge-kit
lock-group-kit
damage-health-kit
resource-node-kit
build-placement-kit
structure-runtime-kit
asset-descriptor-kit
diegetic-feedback-signal-kit
```
