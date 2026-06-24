import { asList, clone, createDefinitionFactory, defineInjectedRuntimeKit, ensureResource } from "../protokit-core/index.js";

export const AGENT_EVAL_HARNESS_KIT_VERSION = "0.1.0";

const idOf = (value, fallback = "item") => String(value ?? fallback).trim() || fallback;
const tickOf = (world) => Number(world?.__nexusClock?.frame ?? 0);

function createInitialState(options = {}) {
  const cases = Object.fromEntries(asList(options.cases).map(normalizeCase).map((entry) => [entry.id, entry]));
  return { version: AGENT_EVAL_HARNESS_KIT_VERSION, cases, order: Object.keys(cases), reports: [], suites: [], lastReason: "initialized" };
}

function normalizeCase(testCase = {}, index = 0) {
  const id = idOf(testCase.id, `agent-eval-${index + 1}`);
  return { id, agentId: testCase.agentId ?? "agent", reason: testCase.reason ?? "eval", context: clone(testCase.context ?? {}), proposal: clone(testCase.proposal ?? null), modelPacket: clone(testCase.modelPacket ?? null), expect: clone(testCase.expect ?? {}), commit: testCase.commit !== false, metadata: clone(testCase.metadata ?? {}) };
}

function reportOk(parts = {}) {
  return [parts.policy, parts.bridge, parts.scenario, parts.replay].every((part) => part == null || part.ok !== false && part.accepted !== false);
}

export function createAgentEvalHarnessKit(nexusRealtime = {}, options = {}) {
  const { resource, event } = createDefinitionFactory(nexusRealtime);
  const AgentEvalState = resource(options.resourceName ?? "agentEval.state");
  const CaseRegistered = event("agentEval.caseRegistered");
  const CaseRun = event("agentEval.caseRun");
  const SuiteRun = event("agentEval.suiteRun");
  const AgentEvalReset = event("agentEval.reset");

  return defineInjectedRuntimeKit(nexusRealtime, {
    id: options.id ?? options.kitId ?? "agent-eval-harness-kit",
    resources: { AgentEvalState },
    events: { CaseRegistered, CaseRun, SuiteRun, AgentEvalReset },
    requires: asList(options.requires),
    provides: ["qa:agent-eval", "agent:eval-report", "agent:model-eval", ...asList(options.provides)],
    initWorld({ world }) { ensureResource(world, AgentEvalState, () => createInitialState(options)); },
    install({ engine, world }) {
      const state = () => ensureResource(world, AgentEvalState, () => createInitialState(options));
      const publish = (next) => { world.setResource(AgentEvalState, next); return clone(next); };
      const run = (entry) => {
        const proposal = clone(entry.proposal) ?? engine.agents?.requestDecision?.(entry.agentId, entry.reason)?.proposal ?? { agentId: entry.agentId, intent: entry.expect?.intent ?? "observe", confidence: 1 };
        let modelRequest = null;
        let modelResponse = null;
        if (entry.modelPacket && engine.modelProvider?.request) {
          modelRequest = engine.modelProvider.request({ agentId: entry.agentId, ...entry.modelPacket });
          if (entry.modelPacket.response) modelResponse = engine.modelProvider.submitResponse(modelRequest.id, entry.modelPacket.response);
        }
        const policy = engine.agentPolicy?.validateProposal ? engine.agentPolicy.validateProposal(proposal, entry.context) : null;
        const bridgePreview = engine.agentCommandBridge?.preview ? engine.agentCommandBridge.preview(proposal, { policy, context: entry.context }) : null;
        const bridgeCommit = entry.commit && bridgePreview?.accepted && engine.agentCommandBridge?.commit ? engine.agentCommandBridge.commit(bridgePreview.preview.proposalId) : null;
        const scenario = entry.expect?.scenarioId && engine.scenarioQa?.runScenario ? engine.scenarioQa.runScenario(entry.expect.scenarioId, { proposal, policy, bridge: bridgeCommit ?? bridgePreview }) : null;
        const replay = engine.deterministicReplay?.verify ? engine.deterministicReplay.verify({ id: entry.id, seed: entry.id, spec: entry.expect, descriptor: { proposal, policy, bridge: bridgeCommit ?? bridgePreview }, budget: { tick: tickOf(world) } }) : null;
        const report = { id: `agent-eval-report-${state().reports.length + 1}`, caseId: entry.id, agentId: entry.agentId, proposal: clone(proposal), modelRequest: clone(modelRequest), modelResponse: clone(modelResponse), policy: clone(policy), bridge: clone(bridgeCommit ?? bridgePreview), scenario: clone(scenario), replay: clone(replay), ranAtTick: tickOf(world) };
        return { ...report, ok: reportOk(report), status: reportOk(report) ? "passed" : "failed" };
      };
      engine[options.apiName ?? "agentEval"] = {
        registerCase(testCase = {}) {
          const next = state();
          const normalized = normalizeCase(testCase, next.order.length);
          next.cases[normalized.id] = normalized;
          next.order = [normalized.id, ...next.order.filter((id) => id !== normalized.id)];
          next.lastReason = "case-registered";
          publish(next);
          world.emit(CaseRegistered, { case: clone(normalized) });
          return clone(normalized);
        },
        runCase(id) {
          const next = state();
          const entry = next.cases[idOf(id)];
          if (!entry) return { ok: false, status: "missing-case", caseId: id };
          const report = run(entry);
          next.reports = [report, ...next.reports].slice(0, Number(options.reportLimit ?? 128));
          next.lastReason = report.status;
          publish(next);
          world.emit(CaseRun, { report: clone(report) });
          return clone(report);
        },
        runSuite(payload = {}) {
          const next = state();
          const ids = asList(payload.caseIds).length ? asList(payload.caseIds).map(String) : next.order.slice().reverse();
          const reports = ids.map((id) => this.runCase(id));
          const suite = { id: payload.id ?? `agent-eval-suite-${next.suites.length + 1}`, ok: reports.every((report) => report.ok), reportIds: reports.map((report) => report.id), caseIds: ids };
          const after = state();
          after.suites = [suite, ...after.suites].slice(0, Number(options.suiteLimit ?? 32));
          after.lastReason = suite.ok ? "suite-passed" : "suite-failed";
          publish(after);
          world.emit(SuiteRun, { suite: clone(suite) });
          return clone({ ...suite, reports });
        },
        latestReport() { return clone(state().reports[0] ?? null); },
        snapshot() { return clone(state()); },
        getState() { return clone(state()); },
        reset(payload = {}) { const next = createInitialState({ ...options, ...payload }); world.setResource(AgentEvalState, next); world.emit(AgentEvalReset, { reason: payload.reason ?? "reset" }); return clone(next); }
      };
    },
    metadata: { version: AGENT_EVAL_HARNESS_KIT_VERSION, domain: "agent-eval-harness", extendsBase: "DomainServiceKit", ownsLoop: false, purpose: "Runs agent proposals through policy, command bridge, scenario, and replay proof surfaces." }
  });
}

export default createAgentEvalHarnessKit;
