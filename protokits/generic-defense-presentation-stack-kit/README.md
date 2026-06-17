# Generic Defense Presentation Stack Kit

Reusable 2.5D cel-shaded presentation DSKs for defense-style games.

This stack is presentation-only. It does not own damage, waves, economy, towers, enemies, or win/loss logic.

## Provides

```txt
generic-stylized-view-rig-kit
generic-cel-material-kit
generic-ink-outline-kit
generic-stylized-lighting-kit
generic-defense-ground-readability-kit
generic-placement-projector-kit
generic-range-ring-kit
generic-defense-unit-render-kit
generic-tower-identity-layer-kit
generic-enemy-readability-layer-kit
generic-combat-vfx-kit
generic-hit-feedback-kit
generic-layered-hud-shell-kit
generic-gameplay-stat-strip-kit
generic-tower-selection-panel-kit
generic-upgrade-tree-panel-kit
generic-selection-context-panel-kit
generic-ui-motion-polish-kit
generic-defense-presentation-stack-kit
```

## Host rule

The renderer should draw descriptor surfaces from:

```js
engine.defensePresentationStack.getSnapshot()
```

The renderer should not inspect simulation resources directly except as a fallback during migration.

## UI rule

The stat strip and panels emit gameplay information only. Controls tutorial text should live outside the gameplay HUD or in docs, not inside the in-game UI.
