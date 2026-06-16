# DSM Implementation Checklist

Use this checklist while implementing a DSM.

## Before writing code

```txt
[ ] I read docs/START-HERE.md.
[ ] I read docs/DSM-ARCHITECTURE.md.
[ ] I checked the current package exports.
[ ] I searched for existing related DSMs/ProtoKits.
[ ] I decided create vs refine vs split.
[ ] I wrote or updated a DSM spec.
[ ] I confirmed the name is reusable, not game-specific.
[ ] I identified the domain meaning.
[ ] I listed the services/API.
[ ] I listed child DSMs.
[ ] I listed data contracts.
[ ] I listed resources/events.
[ ] I planned tests.
```

## Runtime-kit implementation

```txt
[ ] Factory accepts supplied NexusRealtime dependency object.
[ ] Uses defineRuntimeKit from supplied dependency.
[ ] Uses defineResource from supplied dependency.
[ ] Uses defineEvent from supplied dependency.
[ ] Declares resources.
[ ] Declares events.
[ ] Declares systems and phases.
[ ] Declares requires/provides tokens.
[ ] Initializes serializable resources in initWorld.
[ ] Installs small public engine API only when needed.
[ ] Public API exposes getState/getSnapshot/reset/loadSnapshot where relevant.
[ ] Tick behavior is deterministic under fixed delta/input.
```

## Pure service implementation

```txt
[ ] Service is deterministic.
[ ] Service accepts serializable data where practical.
[ ] Service has no hidden globals.
[ ] Service uses seeded random if random is needed.
[ ] Service output is stable and testable.
```

## Renderer boundary

```txt
[ ] Reusable DSM has no DOM dependency.
[ ] Reusable DSM has no Canvas dependency.
[ ] Reusable DSM has no Three.js/WebGL dependency.
[ ] Reusable DSM does not listen to browser input.
[ ] Renderer-facing output is descriptor data only.
```

## Data contracts

```txt
[ ] Required fields are checked or documented.
[ ] Optional fields have defaults.
[ ] IDs are stable.
[ ] Units are documented.
[ ] Seeds are explicit.
[ ] Invalid data behavior is defined.
```

## Tests

```txt
[ ] Import/syntax smoke passes.
[ ] Factory smoke passes.
[ ] Data contract test exists.
[ ] Headless state/service test exists.
[ ] Reset/snapshot test exists if stateful.
[ ] Composition test exists if child DSMs are used.
[ ] Public API test exists if install adds engine API.
```

## Docs/exports

```txt
[ ] package.json export added if public.
[ ] aggregate export updated if applicable.
[ ] kit README added or updated.
[ ] DSM catalog updated if this is a new family.
[ ] README or docs link added if this changes architecture.
```

## Final report

```txt
[ ] Changed files listed.
[ ] DSMs created/refined/split listed.
[ ] Tests run listed.
[ ] Test results listed.
[ ] Commit/branch/PR listed if pushed.
[ ] Known follow-up gaps listed.
```
