# DSM Spec: <Kit Name>

Use this template before implementing a new kit or materially changing an existing one.

```txt
DSM = architecture concept
Kit = implementation unit
```

## 1. Kit name

```txt
<domain-name>-kit
create<DomainName>Kit()
```

Use reusable domain/service naming. Do not name this after a game unless this is explicitly a bridge, preset, deploy wrapper, demo, or test.

Avoid:

```txt
<domain-name>-dsm
create<DomainName>DSM()
```

## 2. Domain meaning

What domain does this kit define?

```txt
This kit defines ...
```

A domain is defined by the kit that owns it. It is not a free-floating category outside the module.

## 3. Services/API

Services are the public API that makes the domain happen.

List public services:

```txt
serviceName(input) -> output
serviceName(input) -> output
```

If runtime-installed, list public engine API:

```txt
engine.<api>.method()
engine.<api>.getState()
engine.<api>.getSnapshot()
engine.<api>.reset()
```

## 4. Data contract

List accepted data:

```js
{
  id: "stable-id",
  seed: "optional-seed"
}
```

Document:

- required fields
- optional fields
- defaults
- units
- ranges
- invalid data behavior

## 5. Resources owned

List state resources this kit owns:

```txt
module.state
module.config
```

State must be serializable unless there is a documented reason.

## 6. Events emitted/consumed

Commands consumed:

```txt
module.commandRequested
```

Facts emitted:

```txt
module.completed
module.changed
```

## 7. Systems/tick behavior

List systems:

```txt
phase: simulate
name: ModuleSystem
behavior: deterministic update from resources/events/input
```

Document whether tick order matters.

## 8. Requires/provides tokens

Requires:

```txt
service:example
```

Provides:

```txt
domain:example
service:example
```

## 9. Child kits

List child kits composed by this module:

```txt
child-domain-kit
child-service-kit
```

Explain why each is a child module rather than private helper code.

## 10. Atomic boundary

Why is this kit the right size?

```txt
It should be split if ...
It should not own ...
```

## 11. Renderer boundary

Allowed output:

```txt
render descriptors
material IDs
instance descriptors
camera/audio/VFX descriptors
```

Renderer/host must own:

```txt
DOM
Canvas
Three.js
WebGL
input listeners
asset loading unless this is an adapter
```

## 12. Tests required

```txt
[ ] import smoke
[ ] factory smoke
[ ] data contract test
[ ] headless state transition
[ ] reset/snapshot test
[ ] composition test if child kits are used
[ ] renderer boundary check or note
```

## 13. Promotion criteria

What would make this stable enough to promote?

```txt
Used by ...
Tested by ...
No game-specific naming ...
Stable API ...
```

## 14. Known non-goals

List what this kit explicitly will not own.
