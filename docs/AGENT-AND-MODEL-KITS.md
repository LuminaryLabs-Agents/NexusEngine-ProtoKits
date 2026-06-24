# Agent and Model Kits

## Purpose

Agent/model work in ProtoKits must stay DSK-first. Agents and model providers can propose behavior, but gameplay mutation still goes through validated kit commands.

## Mainline kit stack

```txt
agent-kit
  Owns agent profiles, memory, goals, context packets, proposal validation, current intent, and trace.

model-provider-adapter-kit
  Owns provider registration plus request/response/failure packets.

agent-policy-validation-kit
  Owns proposal/action policy checks before command bridging.

agent-command-bridge-kit
  Converts accepted proposals into whitelisted command packets.

agent-eval-harness-kit
  Runs agent cases through policy, command bridge, scenario QA, and replay proof surfaces.
```

## Boundary rules

```txt
No provider call inside deterministic gameplay systems.
No model response directly mutates gameplay.
No agent proposal bypasses policy validation.
No command bridge emits unregistered command routes.
No renderer or object API calls from agent/model kits.
```

## Correct flow

```txt
Host or provider adapter submits model response packet.
Model output decoder parses response.
Agent kit stores accepted proposal/intent.
Policy kit validates proposal/actions.
Command bridge maps accepted proposal to a whitelisted command.
Gameplay DSK consumes the command.
Harness kits record proof and replay state.
```
