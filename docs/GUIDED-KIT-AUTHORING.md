# Guided Kit Authoring

## Purpose

Guided kit authoring is the mainline workflow for creating new NexusRealtime ProtoKits without drifting into one-off game code.

Use this flow with `guided-kit-authoring-kit`, `kit-manifest-domain-kit`, `kit-boundary-lint-kit`, and `promotion-readiness-harness`.

## Flow

```txt
1. Define the domain boundary.
2. Write a guided kit spec.
3. Validate required ownership fields.
4. Plan files and exports.
5. Register a kit manifest.
6. Lint boundary risks.
7. Add headless tests.
8. Attach test/proof results.
9. Generate a promotion readiness report.
```

## Spec questions

Every kit spec should answer:

```txt
What domain does this kit own?
What services/API does it expose?
What resources/events/systems does it install?
What does it explicitly not own?
What does it require/provide?
How does it reset?
How does it snapshot?
What tests prove it?
What Experiment can validate it?
```

## Runtime rule

The guided authoring kit stores specs and reports only. It does not write files, call GitHub, or mutate a repository. File generation belongs in scripts or hosts that consume the serializable plan.
