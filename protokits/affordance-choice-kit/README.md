# affordance-choice-kit

Builds legal action packets for agents and commits ranked choices as validated agent proposals.

## Owns

```txt
legal actions
action labels
target binding
preconditions
choice packets
choice commit trace
```

## API

```js
engine.agentChoices.registerAction(action)
engine.agentChoices.getLegalActions(agentId)
engine.agentChoices.buildChoicePacket(agentId)
engine.agentChoices.chooseFromScores(agentId, scores)
engine.agentChoices.commitChoice(agentId, choice)
```

## Boundary

This kit does not run ONNX. It receives scores from a model or script and routes the selected legal action into `agent-kit` as a proposal.
