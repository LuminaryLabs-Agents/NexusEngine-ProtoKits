# DSM Spec: <Name>

Use this template before implementing a new Domain Service Module or materially changing an existing one.

## 1. Module name

```txt
<Name>DSM
```

Use reusable domain/service naming. Do not name this after a game unless this is explicitly a bridge or preset.

## 2. Domain meaning

What domain does this module define?

```txt
This DSM defines ...
```

A domain is defined by the module that owns it. It is not a free-floating category outside the module.

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
  seed: "optional-seed",
  // fields
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

List state resources this DSM owns:

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

## 9. Child DSMs

List child DSMs composed by this module:

```txt
ChildDSM
ChildDSM
```

Explain why each is a child module rather than private helper code.

## 10. Atomic boundary

Why is this DSM the right size?

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
[ ] composition test if child DSMs are used
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

List what this DSM explicitly will not own.
