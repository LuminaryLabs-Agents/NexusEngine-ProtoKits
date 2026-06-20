# audio-feedback-domain-kit

Boundary: `audio-feedback`.

Mental what-if loop:

```txt
What if a domain event should produce sound?
  The kit maps a cue request into an audio descriptor.
  Audio adapters can consume descriptors later.
  The kit does not own WebAudio or a local loop.
```

Extends: NexusRealtime runtime-shaped DomainServiceKit via `defineRuntimeKit`.

Composes:

```txt
event surface
render-descriptor-domain-kit
audio-adapter-domain-kit
```

Smoke environments:

```txt
headless-empty
ember-rail
tideglass-salvage
echo-lock
restart-reset
```

Smoke signature:

```txt
NexusRealtime-scoped-domain-rpg-batch-01::audio-feedback-domain-kit::2026-06-20
```
