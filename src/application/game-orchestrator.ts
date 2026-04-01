import type { GameWithNextAction, PlayerInput } from "@pompidup/kingdomino-engine";
import type { GamePort, Result } from "../domain/ports/game-port.js";
import type { GameConfig } from "../domain/types.js";

export type OrchestratorDeps = {
  gamePort: GamePort;
};

function toPlayerInputs(config: GameConfig): PlayerInput[] {
  return config.players.map((p) => {
    if (p.type === "bot" && p.botLevel) {
      return { name: p.name, bot: { strategyName: p.botLevel } };
    }
    return p.name;
  });
}

export function orchestrateGameSetup(
  deps: OrchestratorDeps,
  config: GameConfig,
): Result<GameWithNextAction> {
  const { gamePort } = deps;

  const createResult = gamePort.createGame(config.mode);
  if (!createResult.ok) return createResult;

  const playerInputs = toPlayerInputs(config);
  const addPlayersResult = gamePort.addPlayers(createResult.value, playerInputs);
  if (!addPlayersResult.ok) return addPlayersResult;

  const addRulesResult = gamePort.addExtraRules(addPlayersResult.value, config.extraRules);
  if (!addRulesResult.ok) return addRulesResult;

  const startResult = gamePort.startGame(addRulesResult.value);
  return startResult;
}
