# affordance-descriptor-domain-kit

Purpose: reusable affordance descriptor domain kit for AAA shell cutover on branch `0.0.2`.

Boundary:

```txt
affordance-descriptor
```

Owns:

```txt
target affordance records
action support checks
affordance resolution
rejection reasons
```

Does not own:

```txt
gameplay completion
renderer picking
browser input
objective progress
```

Extends:

```txt
NexusEngine DomainServiceKit shape through defineRuntimeKit
```

Composes:

```txt
interaction-domain-kit
input-action-domain-kit
future spatial-query-domain-kit
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
NexusEngine-AAA-domain-spine-batch-01::affordance-descriptor-domain-kit::2026-06-20
```
