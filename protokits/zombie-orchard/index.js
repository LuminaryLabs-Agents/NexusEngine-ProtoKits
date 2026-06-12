export {
  SURVIVAL_ROUND_KIT_VERSION,
  createSurvivalRoundKit,
  survivalRoundKitEvents,
  survivalRoundKitResources
} from "../survival-round-kit/index.js";

export {
  HORDE_DIRECTOR_KIT_VERSION,
  createHordeDirectorKit,
  hordeDirectorKitEvents,
  hordeDirectorKitResources
} from "../horde-director-kit/index.js";

export {
  ORCHARD_BIOME_KIT_VERSION,
  createOrchardBiomeKit,
  orchardBiomeDefaults,
  orchardBiomeKitEvents,
  orchardBiomeKitResources
} from "../orchard-biome-kit/index.js";

export {
  FOUND_WEAPON_KIT_VERSION,
  createFoundWeaponKit,
  foundWeaponDefaults,
  foundWeaponKitEvents,
  foundWeaponKitResources
} from "../found-weapon-kit/index.js";

export {
  MONSTER_ROSTER_KIT_VERSION,
  createMonsterRosterKit,
  monsterRosterDefaults,
  monsterRosterKitEvents,
  monsterRosterKitResources
} from "../monster-roster-kit/index.js";

import { createSurvivalRoundKit } from "../survival-round-kit/index.js";
import { createOrchardBiomeKit } from "../orchard-biome-kit/index.js";
import { createMonsterRosterKit } from "../monster-roster-kit/index.js";
import { createHordeDirectorKit } from "../horde-director-kit/index.js";
import { createFoundWeaponKit } from "../found-weapon-kit/index.js";

export const ZOMBIE_ORCHARD_PROTOKITS_VERSION = "0.0.1";

export function createZombieOrchardProtoKits(nexusRealtime = {}, config = {}) {
  return [
    createSurvivalRoundKit(nexusRealtime, config.survivalRounds ?? config.rounds ?? {}),
    createOrchardBiomeKit(nexusRealtime, config.orchardBiome ?? config.orchard ?? {}),
    createMonsterRosterKit(nexusRealtime, config.monsterRoster ?? config.monsters ?? {}),
    createHordeDirectorKit(nexusRealtime, config.hordeDirector ?? config.horde ?? {}),
    createFoundWeaponKit(nexusRealtime, config.foundWeapons ?? config.weapons ?? {})
  ];
}

export const zombieOrchardProtoKitOrder = Object.freeze([
  "zombie-orchard-survival-round-kit",
  "zombie-orchard-biome-kit",
  "zombie-orchard-monster-roster-kit",
  "zombie-orchard-horde-director-kit",
  "zombie-orchard-found-weapon-kit"
]);
