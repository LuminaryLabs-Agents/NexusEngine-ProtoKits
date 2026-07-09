// Smoke signature: NexusEngine-scoped-domain-rpg-batch-02::aggregate::2026-06-20
import { assert, FIVE_SMOKE_ENVIRONMENTS, assertKitContract, installKit } from "./aaa-domain-spine-smoke-harness.mjs";
import { createEnemyObjectDomainKit } from "../protokits/enemy-object-domain-kit/index.js";
import { createEnemyAgentDomainKit } from "../protokits/enemy-agent-domain-kit/index.js";
import { createDamageHealthDomainKit } from "../protokits/damage-health-domain-kit/index.js";
import { createGuardDomainKit } from "../protokits/guard-domain-kit/index.js";
import { createParryWindowDomainKit } from "../protokits/parry-window-domain-kit/index.js";
import { createManaMeterDomainKit } from "../protokits/mana-meter-domain-kit/index.js";
import { createStatusEffectDomainKit } from "../protokits/status-effect-domain-kit/index.js";
import { createVegetationPlacementDomainKit } from "../protokits/vegetation-placement-domain-kit/index.js";
import { createRouteClearanceDomainKit } from "../protokits/route-clearance-domain-kit/index.js";
import { createTerrainGroundContactDomainKit } from "../protokits/terrain-ground-contact-domain-kit/index.js";
import { createWorldZoneDomainKit } from "../protokits/world-zone-domain-kit/index.js";
import { createInteractionDomainKit } from "../protokits/interaction-domain-kit/index.js";

for (const env of FIVE_SMOKE_ENVIRONMENTS) {
  {
    const { kit, engine } = installKit(createEnemyObjectDomainKit, {});
    assertKitContract(kit);
    engine.enemyObjectDomain.register({ id: env.routeId, x: 1, z: 2, bodyId: "body" });
    assert.equal(engine.enemyObjectDomain.move(env.routeId, { x: 3, z: 4 }).position.x, 3, `${env.name}: enemy object moves`);
  }
  {
    const { kit, engine, tick } = installKit(createEnemyAgentDomainKit, { agents: [{ id: "e", x: 0, z: 0, speed: 2 }] });
    assertKitContract(kit);
    engine.enemyAgentDomain.setTarget("e", { x: 10, z: 0 });
    tick(0.5);
    assert.equal(engine.enemyAgentDomain.getState().agentsById.e.mode, "chase", `${env.name}: enemy agent chases`);
  }
  {
    const { kit, engine } = installKit(createDamageHealthDomainKit, { entities: [{ id: "p", health: 10 }] });
    assertKitContract(kit);
    assert.equal(engine.damageHealthDomain.apply("p", 4).health, 6, `${env.name}: damage applies`);
    assert.equal(engine.damageHealthDomain.restore("p", 2).health, 8, `${env.name}: health restores`);
  }
  {
    const { kit, engine } = installKit(createGuardDomainKit, {});
    assertKitContract(kit);
    engine.guardDomain.raise("p", { stamina: 5 });
    assert.equal(engine.guardDomain.absorb("p", 3).blocked, 3, `${env.name}: guard absorbs`);
  }
  {
    const { kit, engine } = installKit(createParryWindowDomainKit, { duration: 0.25 });
    assertKitContract(kit);
    engine.parryWindowDomain.open("p", 0.25);
    assert.equal(engine.parryWindowDomain.attempt("p").ok, true, `${env.name}: parry succeeds in window`);
  }
  {
    const { kit, engine } = installKit(createManaMeterDomainKit, { mana: 10, maxMana: 10 });
    assertKitContract(kit);
    assert.equal(engine.manaMeterDomain.spend(4).ok, true, `${env.name}: mana spend accepted`);
    assert.equal(engine.manaMeterDomain.spend(99).ok, false, `${env.name}: mana spend rejected`);
  }
  {
    const { kit, engine, tick } = installKit(createStatusEffectDomainKit, {});
    assertKitContract(kit);
    engine.statusEffectDomain.apply("p", "burn", { duration: 0.1 });
    tick(0.2);
    assert.equal(engine.statusEffectDomain.getEffects("p").length, 0, `${env.name}: status expires`);
  }
  {
    const { kit, engine } = installKit(createRouteClearanceDomainKit, { route: [{ x: 0, z: 0 }, { x: 10, z: 0 }], clearWidth: 2 });
    assertKitContract(kit);
    assert.equal(engine.routeClearanceDomain.check({ x: 5, z: 0 }, 1).ok, false, `${env.name}: route clearance rejects path overlap`);
    assert.equal(engine.routeClearanceDomain.check({ x: 5, z: 5 }, 1).ok, true, `${env.name}: route clearance accepts off-path`);
  }
  {
    const { kit, engine } = installKit(createTerrainGroundContactDomainKit, { heightAt: (x, z) => x + z });
    assertKitContract(kit);
    assert.equal(engine.terrainGroundContactDomain.ground({ id: "a", x: 2, z: 3 }).y, 5, `${env.name}: terrain contact grounds object`);
  }
  {
    const { kit, engine } = installKit(createWorldZoneDomainKit, { zones: [{ id: "safe", x: 0, z: 0, radius: 2 }] });
    assertKitContract(kit);
    assert.deepEqual(engine.worldZoneDomain.setEntityPosition("p", { x: 0, z: 0 }), ["safe"], `${env.name}: zone membership entered`);
  }
  {
    const { kit, engine } = installKit(createVegetationPlacementDomainKit, { minSpacing: 0.1 });
    assertKitContract(kit);
    assert.equal(engine.vegetationPlacementDomain.tryPlace({ id: "a", x: 0, z: 0, radius: 2 }).ok, true, `${env.name}: vegetation placement accepts first`);
    assert.equal(engine.vegetationPlacementDomain.tryPlace({ id: "b", x: 1, z: 0, radius: 2 }).reason, "vegetation-overlap", `${env.name}: vegetation placement rejects overlap`);
  }
  {
    const { kit, engine, tick } = installKit(createInteractionDomainKit, { targets: [{ id: "gate", actions: ["open"] }] });
    assertKitContract(kit);
    engine.interactionDomain.request("gate", "open", { routeId: env.routeId });
    tick(env.dt);
    assert.equal(engine.interactionDomain.getState().lastResult.ok, true, `${env.name}: interaction completes`);
  }
}
