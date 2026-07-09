# scenario-smoke-domain-kit

Purpose: reusable route validation harness domain kit for AAA shell cutover on branch `0.0.2`.

Boundary:

```txt
scenario-smoke
```

Owns:

```txt
route action checklist
completed route actions
rejected route actions
signed route check state
```

Does not own:

```txt
renderer state
browser input
game-specific art
full scenario authoring
```

Extends:

```txt
NexusEngine HarnessKit shape through defineRuntimeKit
```

Composes:

```txt
input-action-domain-kit
objective-flow-domain-kit
scenario-qa-harness
```

Loop policy:

```txt
ownsLoop: false
engine tick only
```

Smoke coverage:

```txt
headless-empty
ember-rail
tideglass-salvage
echo-lock
restart-reset
```

Smoke signature:

```txt
NexusEngine-AAA-domain-spine-batch-01::scenario-smoke-domain-kit::2026-06-20
```
