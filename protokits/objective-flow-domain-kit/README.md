# objective-flow-domain-kit

Purpose: reusable objective flow domain kit for AAA shell cutover on branch `0.0.2`.

Boundary:

```txt
objective-flow
```

Owns:

```txt
objective steps
step progress
completion state
failure state
objective events
```

Does not own:

```txt
renderer HUD
one-game tutorial copy
browser input
route art
```

Extends:

```txt
NexusRealtime DomainServiceKit shape through defineRuntimeKit
```

Composes:

```txt
completion-ledger-kit
sequence runtime
scenario-smoke-domain-kit
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
NexusRealtime-AAA-domain-spine-batch-01::objective-flow-domain-kit::2026-06-20
```
