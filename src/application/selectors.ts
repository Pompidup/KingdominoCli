import type {
  Player,
  Lord,
  Domino,
  Kingdom,
  RevealsDomino,
  Score,
  GameWithNextAction,
} from "@pompidup/kingdomino-engine";
import { isGameWithNextAction } from "@pompidup/kingdomino-engine";
import type { AppState } from "../domain/types.js";

export function getActiveLord(state: AppState): Lord | null {
  const { gameState } = state;
  if (!gameState || !isGameWithNextAction(gameState)) return null;
  const game = gameState as GameWithNextAction;
  return game.lords.find((l) => l.id === game.nextAction.nextLord) ?? null;
}

export function getActivePlayer(state: AppState): Player | null {
  const lord = getActiveLord(state);
  if (!lord || !state.gameState) return null;
  return state.gameState.players.find((p) => p.id === lord.playerId) ?? null;
}

export function getCurrentDomino(state: AppState): Domino | null {
  const lord = getActiveLord(state);
  return lord?.dominoPicked ?? null;
}

export function getCurrentAction(state: AppState): string | null {
  const { gameState } = state;
  if (!gameState || !isGameWithNextAction(gameState)) return null;
  return (gameState as GameWithNextAction).nextAction.nextAction;
}

export function getDraftDominoes(state: AppState): RevealsDomino[] {
  return state.gameState?.currentDominoes ?? [];
}

export function getKingdomForDisplay(state: AppState): Kingdom | null {
  const player = getActivePlayer(state);
  return player?.kingdom ?? null;
}

export function getScores(
  state: AppState,
  calculateScore: (kingdom: Kingdom) => Score,
): { playerId: string; playerName: string; score: Score }[] {
  if (!state.gameState) return [];
  return state.gameState.players.map((p) => ({
    playerId: p.id,
    playerName: p.name,
    score: calculateScore(p.kingdom),
  }));
}
