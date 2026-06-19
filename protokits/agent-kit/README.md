# agent-kit

`agent-kit` is the NexusRealtime agent domain ProtoKit. It owns in-game agent profiles, memory, goals, decision context, proposal validation, and decision traces.

Harnesses are pluggable decision sources. The kit includes fake, scripted, replay, ONNX-score, and live-dry-run harness factories. Harnesses only produce structured proposals. Gameplay still commits through normal kits, DSKs, events, and sequences.

## Exports

```js
createAgentKit
createFakeAgentHarness
createScriptedAgentHarness
createReplayAgentHarness
createOnnxAgentHarness
createLiveAgentHarness
```

## Engine API

```js
engine.agents.create(profile)
engine.agents.remember(agentId, fact)
engine.agents.setGoal(agentId, goal)
engine.agents.buildContext(agentId, reason)
engine.agents.requestDecision(agentId, reason)
engine.agents.submitProposal(agentId, proposal)
engine.agents.getAgent(agentId)
engine.agents.getState()
engine.agents.getTrace(agentId)
```

## Boundary

The kit does not call models by itself and does not mutate renderer objects. Live model integrations should use a harness or loader kit, submit a structured proposal, and let `agent-kit` validate the proposal.

## Dry run

Use `createFakeAgentHarness()` for deterministic no-LLM experiments and tests.
