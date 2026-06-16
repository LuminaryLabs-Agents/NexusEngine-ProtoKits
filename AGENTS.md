# Agent Instructions for NexusRealtime-ProtoKits

Start with `docs/START-HERE.md` before implementing or refining any ProtoKit.

This repository uses **DSM architecture**: Domain Service Modules.

A DSM is a reusable module that defines a domain and exposes services/API that make that domain happen. Games compose DSMs through data; games should not define reusable architecture directly.

## Required reading for any major change

1. `docs/START-HERE.md`
2. `docs/DSM-ARCHITECTURE.md`
3. `docs/DSM-AUTHORING-GUIDE.md`
4. `docs/DSM-AGENT-WORKFLOW.md`
5. `docs/DSM-SPLIT-RULES.md`
6. `docs/DSM-DATA-CONTRACTS.md`
7. `docs/DSM-TESTING-GUIDE.md`
8. `docs/DSM-PROMOTION-GUIDE.md`
9. `docs/DSM-CATALOG.md`
10. `docs/templates/DSM-SPEC.md`

## Non-negotiable rules

- Do not build game-specific feature blobs in reusable ProtoKits.
- Do not name generic modules after games.
- Do not put DOM, Canvas, Three.js, WebGL, browser input, fetch, localStorage, Date.now, or unseeded random inside reusable DSMs.
- Do use NexusRealtime runtime-kit contracts when a DSM installs into the engine.
- Do define resources/events/systems/requires/provides/initWorld/install/metadata when runtime-installed.
- Do keep data serializable and deterministic.
- Do add headless tests for reusable behavior.
- Do document domain meaning and services/API before or alongside implementation.

## Agent loop

```txt
inspect repo -> classify request -> identify DSM -> create/refine/split -> write spec -> implement -> test -> export -> document -> report
```

If unsure whether something is a DSM, bridge, preset, renderer adapter, or experiment-only code, read `docs/DSM-SPLIT-RULES.md` before editing.
