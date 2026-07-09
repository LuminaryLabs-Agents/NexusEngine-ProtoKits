import { defineInjectedRuntimeKit } from "../foundation-kit/index.js";

export const OBJECTIVE_FLOW_KIT_VERSION = "0.0.1";

export function createObjectiveFlow(steps = [], options = {}) {
  const flow = { id: options.id ?? "objective-flow", index: 0, completed: false, failed: false, steps: steps.map((step, index) => ({ id: step.id ?? `step-${index + 1}`, label: step.label ?? step.id ?? `Step ${index + 1}`, complete: false, ...step })), history: [] };
  flow.current = () => flow.steps[flow.index] ?? null;
  return flow;
}

export function completeCurrentObjective(flow, payload = {}) {
  const current = flow.current?.();
  if (!current || flow.completed || flow.failed) return flow;
  current.complete = true;
  flow.history.push({ id: current.id, payload, completedAt: payload.time ?? 0 });
  flow.index += 1;
  flow.completed = flow.index >= flow.steps.length;
  return flow;
}

export function updateObjectiveFlow(flow, context = {}) {
  if (flow.completed || flow.failed) return flow;
  const current = flow.current?.();
  if (!current) { flow.completed = true; return flow; }
  if (typeof current.when === "function" && current.when(context, flow)) completeCurrentObjective(flow, context);
  return flow;
}

export function objectiveSummary(flow) {
  const current = flow.current?.();
  return { id: flow.id, completed: flow.completed, failed: flow.failed, index: flow.index, total: flow.steps.length, current: current ? { id: current.id, label: current.label } : null, progress: flow.steps.length ? flow.index / flow.steps.length : 1 };
}

export function createObjectiveFlowKit(nexusEngine = {}, options = {}) {
  const kit = { id: options.id ?? "objective-flow-kit", version: OBJECTIVE_FLOW_KIT_VERSION, createObjectiveFlow, completeCurrentObjective, updateObjectiveFlow, objectiveSummary };
  return Object.freeze({ ...kit, createRuntimeKit(runtimeOptions = {}) { return defineInjectedRuntimeKit(nexusEngine, { id: runtimeOptions.id ?? kit.id, provides: runtimeOptions.provides ?? ["objective:flow", "objective:steps", "objective:summary"], bindings: { objectiveFlowKit: kit }, metadata: { version: OBJECTIVE_FLOW_KIT_VERSION, ...(runtimeOptions.metadata ?? {}) } }); } });
}
