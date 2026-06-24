# Agent Instructions for NexusRealtime-ProtoKits

Start with `docs/START-HERE.md` before implementing or refining any ProtoKit.

This repository uses **DSM architecture**: Domain Service Modules.

A DSM is a reusable module that defines a domain and exposes services/API that make that domain happen. Games compose DSMs through data; games should not define reusable architecture directly.

## Required reading for any major change

1. `docs/START-HERE.md`
2. `docs/DOMAIN-FIRST-COMPOSITION-MASTER-PLAN.md`
3. `docs/DOMAIN-SCOPE-TAXONOMY.md`
4. `docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md`
5. `docs/DSM-ARCHITECTURE.md`
6. `docs/DSM-AUTHORING-GUIDE.md`
7. `docs/DSM-AGENT-WORKFLOW.md`
8. `docs/DSM-SPLIT-RULES.md`
9. `docs/DSM-DATA-CONTRACTS.md`
10. `docs/DSM-TESTING-GUIDE.md`
11. `docs/DSM-PROMOTION-GUIDE.md`
12. `docs/DSM-CATALOG.md`
13. `docs/templates/DOMAIN-SPEC.md`
14. `docs/templates/DOMAIN-MANIFEST.md`
15. `docs/templates/DSM-SPEC.md`

## Non-negotiable rules

- Do not build game-specific feature blobs in reusable ProtoKits.
- Do not name generic modules after games unless the kit is explicitly a mode, route, or application domain.
- Do not add vague helper/tool kits when the boundary should be a scoped domain.
- Do not put DOM, Canvas, Three.js, WebGL, browser input, fetch, localStorage, Date.now, or unseeded random inside reusable DSMs.
- Do use NexusRealtime runtime-kit contracts when a DSM installs into the engine.
- Do define resources/events/systems/requires/provides/initWorld/install/metadata when runtime-installed.
- Do keep data serializable and deterministic.
- Do add headless tests for reusable behavior.
- Do document domain meaning, scope, and services/API before or alongside implementation.

## Domain-first composition track

For self-composing domain work, follow `docs/DOMAIN-FIRST-COMPOSITION-MASTER-PLAN.md` and `docs/DOMAIN-SCOPE-TAXONOMY.md`.

Every logic space must be classified before implementation as a scoped domain, data/content, sequence flow, adapter bridge, proof/harness, mode, application, or route composition.

## Mainline guided kit track

For guided kit authoring, model/agent adapter boundaries, harness canonicalization, and promotion readiness work, follow `docs/MAINLINE-GUIDED-KITS-MASTER-PLAN.md`.

Important: this is a **mainline** implementation track. Do not create a `v3` branch, `v3` package namespace, or parallel ProtoKits core for this work.

## Agent loop

```txt
inspect repo -> classify request -> identify DSM -> create/refine/split -> write spec -> implement -> test -> export -> document -> report
```

If unsure whether something is a DSM, bridge, preset, renderer adapter, or experiment-only code, read `docs/DOMAIN-SCOPE-TAXONOMY.md` and `docs/DSM-SPLIT-RULES.md` before editing.
