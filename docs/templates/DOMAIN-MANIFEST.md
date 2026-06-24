# Domain Manifest Template

Use this template for every scoped domain kit.

```js
export const manifest = {
  id: "heat-pressure-domain-kit",
  domain: "heat-pressure",
  parentDomain: "pressure",
  scope: "atomic-domain",

  extendsBase: "DomainServiceKit",

  composes: [
    "pressure-domain-kit",
    "telemetry-domain-kit"
  ],

  requires: [
    "n:runtime.engine"
  ],

  provides: [
    "n:pressure.heat"
  ],

  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",

  exportPath: "./heat-pressure-domain-kit",
  sourcePath: "protokits/heat-pressure-domain-kit/index.js",
  testPaths: [
    "tests/heat-pressure-domain-kit-smoke.test.mjs"
  ],

  status: "experimental",
  metadata: {
    purpose: "Owns heat-pressure service rules.",
    doesOwn: ["heat pressure state", "threshold validation", "pressure events"],
    doesNotOwn: ["renderer", "DOM", "Canvas", "network calls"]
  }
};
```

## Required fields

```txt
id
domain
scope
extendsBase
provides
exportPath
sourcePath
status
```

## Recommended fields

```txt
parentDomain
composes
requires
ownsLoop
snapshotPolicy
resetPolicy
testPaths
metadata.purpose
metadata.doesOwn
metadata.doesNotOwn
```

## Rule

If a domain cannot fill out this manifest honestly, it is not ready to become a reusable domain kit.
