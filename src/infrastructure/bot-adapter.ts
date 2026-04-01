import type {
  GameEngine,
  GameWithNextAction,
  GameState,
  BotStrategy,
} from "@pompidup/kingdomino-engine";
import {
  playBotTurn as enginePlayBotTurn,
  isBotTurn as engineIsBotTurn,
  getStrategyNames as engineGetStrategyNames,
  randomStrategy,
  greedyStrategy,
  advancedStrategy,
  expertStrategy,
} from "@pompidup/kingdomino-engine";
import type { BotPort } from "../domain/ports/bot-port.js";
import type { Result } from "../domain/ports/game-port.js";

const strategyMap: Record<string, BotStrategy> = {
  random: randomStrategy,
  greedy: greedyStrategy,
  advanced: advancedStrategy,
  expert: expertStrategy,
};

export class BotAdapter implements BotPort {
  playBotTurn(engine: GameEngine, game: GameWithNextAction): Result<GameState> {
    try {
      const player = game.players.find((p) =>
        game.lords.some((l) => l.id === game.nextAction.nextLord && l.playerId === p.id),
      );
      const strategyName = player?.bot?.strategyName ?? "random";
      const strategy = strategyMap[strategyName];
      if (!strategy) {
        return {
          ok: false,
          error: { code: "UNKNOWN_STRATEGY", message: `Unknown strategy: ${strategyName}` },
        };
      }
      const newState = enginePlayBotTurn(engine, game, strategy);
      return { ok: true, value: newState };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: { code: "BOT_ERROR", message } };
    }
  }

  isBotTurn(game: GameWithNextAction): boolean {
    return engineIsBotTurn(game);
  }

  getStrategyNames(): string[] {
    return engineGetStrategyNames();
  }
}
