import { createGenericProtoKit } from "../generic-kit-utils/index.js";
export const GENERIC_TUTORIAL_PROMPT_KIT_VERSION = "0.1.0";
export const GENERIC_TUTORIAL_PROMPT_KIT_DEFINITION = Object.freeze({ id: "generic-tutorial-prompt-kit", camelName: "genericTutorialPromptKit", engineKey: "genericTutorialPrompt", category: "mission-sequence", tier: "atomic", provides: ["mission:tutorial-prompts"], requires: ["mission:objective", "input:actions"], purpose: "Generic tutorial prompt state driven by missing action, objective, or sequence conditions." });
export function createGenericTutorialPromptKit(NexusRealtime, config = {}) { return createGenericProtoKit(NexusRealtime, GENERIC_TUTORIAL_PROMPT_KIT_DEFINITION, config); }
export default createGenericTutorialPromptKit;
