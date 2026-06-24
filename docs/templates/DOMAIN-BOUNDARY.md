# <domain> Boundary

## Boundary ID

`<domain>`

## Kit ID

`<domain>-kit`

## Responsibility

One sentence describing the domain boundary.

## Resources

- `domain.state`

## Events

- `domain.command`
- `domain.updated`

## Public methods

- `engine.domain.getState`
- `engine.domain.snapshot`

## Snapshots

- `domain`
- `domain.items`

## Descriptors

- `descriptor-kind`

## Non-ownership

This boundary does not own DOM, Canvas, renderer objects, asset loading, host input listeners, or one-off scene scripting.

## Adjacent boundaries

- `adjacent-domain`

## Validation

- Resources/events are explicit.
- Methods are small and idempotent where possible.
- State is serializable.
- Renderer boundary is clean.
- Performance contract exists.
