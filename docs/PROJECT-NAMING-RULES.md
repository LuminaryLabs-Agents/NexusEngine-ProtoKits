# Project Naming Rules

## Intent

ProtoKits should organize normal reusable projects, deploy manifests, scenes, and domain kits. Some projects may target high-fidelity desktop quality, but that quality bar should not become a naming category or domain boundary.

## Preferred language

```txt
high-fidelity project
desktop-fidelity project
project batch
generated project
vertical slice
composition-ready app
polished route
quality target
```

## Avoid as future names

```txt
quality-tier kit names
quality-tier bridge names
quality-tier domain names
quality-tier family names
```

## Rename map

```txt
batch with quality-tier label -> project batch
quality-tier app -> high-fidelity app
quality-tier desktop -> desktop-fidelity
quality-tier vertical slice -> high-fidelity vertical slice
quality-tier deploy bridge -> project deploy bridge
quality-tier content pass -> polish pass
```

## Compatibility

Legacy paths that already include quality-tier wording remain available as aliases so existing imports do not break.

New code should use:

```txt
project-batch-deploy-bridge
generic-defense-project-kits
generic-defense-project-bridge
```

## Rule

Quality target words may describe the intended fidelity of a project. They should not define the architecture category.
