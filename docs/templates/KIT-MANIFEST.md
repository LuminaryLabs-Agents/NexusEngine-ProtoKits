# Kit Manifest Template

```js
export const manifest = {
  id: "example-domain-kit",
  domain: "example",
  parentDomain: null,
  scope: "domain-kit",
  extendsBase: "DomainServiceKit",
  composes: [],
  requires: [],
  provides: ["example:state"],
  ownsLoop: false,
  snapshotPolicy: "serializable",
  resetPolicy: "engine-reset-aware",
  exportPath: "./example-domain-kit",
  sourcePath: "protokits/example-domain-kit/index.js",
  testPaths: ["tests/example-domain-kit-smoke.test.mjs"],
  status: "experimental"
};
```

Use this shape with `kit-manifest-domain-kit` and `promotion-readiness-harness`.
