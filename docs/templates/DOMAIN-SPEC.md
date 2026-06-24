# Domain Spec Template

Use this before creating or expanding a scoped domain kit.

```txt
# Domain Spec: <domain-kit-id>

## Boundary

What is the exact boundary of meaning?

## Scope

atomic-domain / feature-domain / stack-domain / mode-domain / application-domain / route-domain / adapter-domain / content-domain / proof-domain

## Purpose

What service does this domain provide?

## Does Own

- state:
- events:
- validation:
- public API:
- descriptors:
- composition rules:
- debug/snapshot/reset behavior:

## Does Not Own

- renderer:
- DOM/Canvas/Three.js:
- host input listeners:
- one-off game scripting:
- hidden network calls:

## Resources

- 

## Events

- 

## Components

- 

## Systems

- 

## Public Engine API

```js
engine.<domain>.action(payload)
engine.<domain>.getState()
```

## Requires

- 

## Provides

- 

## Composes

- 

## Config/Data Contract

```js
{
  id: "",
  tuning: {},
  content: []
}
```

## Headless Tests

- initial state
- valid action
- invalid action
- tick simulation
- reset
- serializable snapshot
- deterministic replay

## Promotion Criteria

- generic name
- renderer independent
- headless tests
- multi-config proof
- docs
- stable resources/events/API
```
