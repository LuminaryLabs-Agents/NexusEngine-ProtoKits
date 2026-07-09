# ONNX Workspace Kits

Experimental Domain Service Kits for a 3D ONNX agent workspace where chat remains the feedback surface, but every world object exposes input, inference, output, and trace state.

## Kit stack

`createOnnxWorkspaceKits(NexusEngine, config)` installs:

- `chat-io-domain-kit` — chat input/output packets, thread records, packet links.
- `conversation-bubble-domain-kit` — world-space bubble lifecycle and render descriptors.
- `model-output-decoder-domain-kit` — generated text/logit JSON decoding into phase/message/done/action score records.
- `loop-guard-domain-kit` — stop policy for self-talk loops.
- `prompt-composer-domain-kit` — prompt packets from chat input, observation, memory, facts, legal actions, and loop history.
- `inference-trace-domain-kit` — input → prompt → tokenization → ONNX run → decoded output → guard trace records.
- `workspace-entity-domain-kit` — selectable workspace objects and render descriptors.
- `workspace-layout-domain-kit` — zones, anchors, and entity placement.
- `model-core-visual-domain-kit` — floating ONNX model core descriptors and pulses.
- `agent-avatar-domain-kit` — visible agent pose, mood, focus, and speaking descriptors.
- `three-render-adapter-kit` — Three.js scene-plan descriptors without importing Three.js.
- `self-talk-loop-domain-kit` — chat-like autonomous loop that composes prompt, encodes, runs ONNX when available, decodes, creates bubbles, records traces, and repeats until guarded done.

## Example

```js
import { createOnnxWorkspaceKits } from "@luminarylabs/nexusengine-protokits/onnx-workspace-kits";

const engine = NexusEngine.createRealtimeGame({
  kits: [
    ...createOnnxWorkspaceKits(NexusEngine, {
      selfTalkLoop: {
        defaultAgentId: "guide",
        defaultModelId: "onnx-community/Qwen2.5-0.5B-Instruct",
        maxTurns: 6
      }
    })
  ]
});

const loop = engine.selfTalkLoop.start({
  inputText: "Explain this ONNX workspace.",
  agentId: "guide"
});

engine.selfTalkLoop.runStep(loop.id, {
  output: JSON.stringify({
    phase: "observe",
    message: "I see a request to explain the workspace.",
    done: false,
    next_phase: "think",
    confidence: 0.6
  })
});
```

## Boundary

These kits do not render directly, create DOM, import Three.js, or let ONNX mutate gameplay. ONNX/model output becomes decoded text, proposed action scores, done flags, traces, and visible feedback descriptors. Other DSKs validate and commit meaning.
