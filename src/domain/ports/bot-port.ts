import type { GameEngine, GameWithNextAction, GameState } from "@pompidup/kingdomino-engine";
import type { Result } from "./game-port.js";

export interface BotPort {
  playBotTurn(engine: GameEngine, game: GameWithNextAction): Result<GameState>;
  isBotTurn(game: GameWithNextAction): boolean;
  getStrategyNames(): string[];
}
