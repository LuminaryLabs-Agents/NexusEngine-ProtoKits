# action-window-domain-kit

Purpose: reusable timing-window domain kit for AAA shell cutover on branch `0.0.2`.

Boundary:

```txt
action-window
```

Owns:

```txt
window timing
window completion
attempt records
success/failure events
```

Does not own:

```txt
browser input
animation loops
renderer state
one-game tutorial timing
```

Extends:

```txt
NexusRealtime DomainServiceKit shape through defineRuntimeKit
```

Composes:

```txt
input-action-domain-kit
pressure-domain-kit
future parry/forge/lock/tune domains
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
NexusRealtime-AAA-domain-spine-batch-01::action-window-domain-kit::2026-06-20
```
