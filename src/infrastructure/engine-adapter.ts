import type {
  GameEngine,
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
  DomainException,
} from "@pompidup/kingdomino-engine";
import type { GamePort, Result } from "../domain/ports/game-port.js";

function wrapResult<T>(fn: () => T): Result<T> {
  try {
    return { ok: true, value: fn() };
  } catch (err: unknown) {
    const domainErr = err as InstanceType<typeof DomainException>;
    if (domainErr && typeof domainErr === "object" && "code" in domainErr) {
      return {
        ok: false,
        error: { code: domainErr.code as string, message: domainErr.message },
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: { code: "UNKNOWN_ERROR", message } };
  }
}

export class EngineAdapter implements GamePort {
  constructor(private readonly engine: GameEngine) {}

  getEngine(): GameEngine {
    return this.engine;
  }

  getModes(): GameMode[] {
    return this.engine.getModes({});
  }

  getExtraRules(mode: string, playerCount: number): ExtraRule[] {
    return this.engine.getExtraRules({ mode, players: playerCount });
  }

  createGame(mode: string): Result<GameWithNextStep> {
    return wrapResult(() => this.engine.createGame({ mode }));
  }

  addPlayers(game: GameState, players: PlayerInput[]): Result<GameWithNextStep> {
    return wrapResult(() => this.engine.addPlayers({ game, players }));
  }

  addExtraRules(game: GameState, extraRules: string[]): Result<GameWithNextStep> {
    return wrapResult(() => this.engine.addExtraRules({ game, extraRules }));
  }

  startGame(game: GameState): Result<GameWithNextAction> {
    return wrapResult(() => this.engine.startGame({ game }));
  }

  chooseDomino(game: GameState, dominoPick: number, lordId: string): Result<GameWithNextAction> {
    return wrapResult(() => this.engine.chooseDomino({ game, dominoPick, lordId }));
  }

  placeDomino(
    game: GameState,
    lordId: string,
    position: Position,
    rotation: Rotation,
  ): Result<GameState> {
    return wrapResult(() => this.engine.placeDomino({ game, lordId, position, rotation }));
  }

  discardDomino(game: GameState, lordId: string): Result<GameState> {
    return wrapResult(() => this.engine.discardDomino({ game, lordId }));
  }

  getValidPlacements(kingdom: Kingdom, domino: Domino, maxKingdomSize?: number): ValidPlacement[] {
    return this.engine.getValidPlacements({ kingdom, domino, maxKingdomSize });
  }

  canPlaceDomino(kingdom: Kingdom, domino: Domino, maxKingdomSize?: number): boolean {
    return this.engine.canPlaceDomino({ kingdom, domino, maxKingdomSize });
  }

  calculateScore(kingdom: Kingdom): Score {
    return this.engine.calculateScore({ kingdom });
  }

  getResults(game: GameState): Result<GameWithResults> {
    return wrapResult(() => this.engine.getResults({ game }));
  }
}
