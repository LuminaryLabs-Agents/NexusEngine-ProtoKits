# composition-planning-domain-kit

## Purpose

Owns the composition planning domain for higher-scope domain recipes.

It registers composition recipes, creates install plans, validates missing dependencies, suggests missing domains, and scores whether a composition is ready for simulation/proof.

## Public API

```txt
engine.compositionPlanning.registerRecipe(recipe)
engine.compositionPlanning.planComposition(goal)
engine.compositionPlanning.createInstallPlan(idOrRecipe)
engine.compositionPlanning.validateComposition(idOrRecipe)
engine.compositionPlanning.suggestMissingDomains(idOrRecipe)
engine.compositionPlanning.scoreComposition(idOrRecipe)
engine.compositionPlanning.getState()
engine.compositionPlanning.reset()
```

## Boundary

Does own:

```txt
composition recipes
install plans
missing dependency reports
composition validation
composition readiness score
```

Does not own:

```txt
child domain gameplay rules
agent proposals
filesystem writes
HTML hosts
renderers
```
