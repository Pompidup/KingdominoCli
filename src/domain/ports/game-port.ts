import type {
  GameState,
  GameWithNextStep,
  GameWithNextAction,
  GameWithResults,
  GameMode,
  ExtraRule,
  Score,
  ValidPlacement,
  PlayerInput,
  Kingdom,
  Domino,
  Position,
  Rotation,
} from "@pompidup/kingdomino-engine";

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string } };

export interface GamePort {
  getModes(): GameMode[];
  getExtraRules(mode: string, playerCount: number): ExtraRule[];
  createGame(mode: string): Result<GameWithNextStep>;
  addPlayers(game: GameState, players: PlayerInput[]): Result<GameWithNextStep>;
  addExtraRules(game: GameState, extraRules: string[]): Result<GameWithNextStep>;
  startGame(game: GameState): Result<GameWithNextAction>;
  chooseDomino(game: GameState, dominoPick: number, lordId: string): Result<GameWithNextAction>;
  placeDomino(
    game: GameState,
    lordId: string,
    position: Position,
    rotation: Rotation,
  ): Result<GameState>;
  discardDomino(game: GameState, lordId: string): Result<GameState>;
  getValidPlacements(kingdom: Kingdom, domino: Domino, maxKingdomSize?: number): ValidPlacement[];
  canPlaceDomino(kingdom: Kingdom, domino: Domino, maxKingdomSize?: number): boolean;
  calculateScore(kingdom: Kingdom): Score;
  getResults(game: GameState): Result<GameWithResults>;
}
