export const QUEST_DOMAIN_KIT_VERSION = "0.1.0";

const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));
const asArray = (value) => Array.isArray(value) ? value : value == null ? [] : [value];
const toNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

function requireNexus(NexusRealtime) {
  for (const key of ["defineRuntimeKit", "defineResource", "defineEvent"]) {
    if (typeof NexusRealtime?.[key] !== "function") throw new TypeError(`createQuestDomainKit requires NexusRealtime.${key}.`);
  }
}

function normalizeQuest(quest = {}, index = 0) {
  const steps = asArray(quest.steps).map((step, stepIndex) => ({ id: String(step.id ?? `step-${stepIndex + 1}`), label: String(step.label ?? step.id ?? `Step ${stepIndex + 1}`), target: Math.max(1, toNumber(step.target, 1)), progress: Math.max(0, toNumber(step.progress, 0)), completed: Boolean(step.completed) }));
  return { id: String(quest.id ?? `quest-${index + 1}`), label: String(quest.label ?? quest.id ?? `Quest ${index + 1}`), active: quest.active !== false, completed: false, steps, currentStepIndex: 0 };
}

function rebuildQuest(quest) {
  const steps = quest.steps.map((step) => ({ ...step, completed: step.completed || step.progress >= step.target }));
  return { ...quest, steps, completed: steps.length > 0 && steps.every((step) => step.completed), currentStepIndex: Math.min(quest.currentStepIndex, Math.max(0, steps.length - 1)) };
}

function createState(config = {}) {
  const quests = asArray(config.quests).map(normalizeQuest).map(rebuildQuest);
  return { version: QUEST_DOMAIN_KIT_VERSION, id: config.stateId ?? "quest-domain", domain: "quest", quests, questsById: Object.fromEntries(quests.map((quest) => [quest.id, quest])), lastEvent: null };
}

function rebuildState(state) {
  const quests = state.quests.map(rebuildQuest);
  return { ...state, quests, questsById: Object.fromEntries(quests.map((quest) => [quest.id, quest])) };
}

export function createQuestDomainKit(NexusRealtime, config = {}) {
  requireNexus(NexusRealtime);
  const { defineRuntimeKit, defineResource, defineEvent } = NexusRealtime;
  const QuestState = defineResource(config.resourceName ?? "questDomain.state");
  const QuestAdvanced = defineEvent("quest.advanced");
  const QuestCompleted = defineEvent("quest.completed");
  const QuestRejected = defineEvent("quest.rejected");

  return defineRuntimeKit({
    id: config.kitId ?? "quest-domain-kit",
    provides: ["n:quest", "quest:state"],
    resources: { QuestState },
    events: { QuestAdvanced, QuestCompleted, QuestRejected },
    systems: [],
    initWorld({ world }) { world.setResource(QuestState, createState(config)); },
    install({ engine, world }) {
      engine.questDomain = {
        advance(questId, amount = 1, payload = {}) {
          let state = rebuildState(world.getResource(QuestState) ?? createState(config));
          const quest = state.questsById[String(questId)];
          if (!quest || quest.completed) {
            const rejected = { questId, reason: !quest ? "missing-quest" : "quest-completed" };
            world.emit(QuestRejected, rejected);
            state = { ...state, lastEvent: rejected };
            world.setResource(QuestState, state);
            return clone(state);
          }
          const stepIndex = quest.currentStepIndex;
          const steps = quest.steps.map((step, index) => index === stepIndex ? { ...step, progress: step.progress + toNumber(amount, 1) } : step);
          const nextQuest = rebuildQuest({ ...quest, steps });
          const nextIndex = nextQuest.steps[stepIndex]?.completed && stepIndex < nextQuest.steps.length - 1 ? stepIndex + 1 : stepIndex;
          const updatedQuest = rebuildQuest({ ...nextQuest, currentStepIndex: nextIndex });
          const quests = state.quests.map((item) => item.id === quest.id ? updatedQuest : item);
          state = rebuildState({ ...state, quests, lastEvent: { questId, amount, ...payload } });
          world.setResource(QuestState, state);
          world.emit(QuestAdvanced, { questId, amount, completed: updatedQuest.completed });
          if (updatedQuest.completed) world.emit(QuestCompleted, { questId });
          return clone(state);
        },
        getState() { return clone(world.getResource(QuestState)); }
      };
    },
    metadata: { domain: "quest", parentDomain: "progression", scope: "large-domain", extendsBase: "DomainServiceKit", composes: ["objective-flow-domain-kit", "sequence-prompt-domain-kit", "dialogue-domain-kit"], ownsLoop: false, purpose: "Owns quest records and step progression as reusable open-world RPG state." }
  });
}

export default createQuestDomainKit;
