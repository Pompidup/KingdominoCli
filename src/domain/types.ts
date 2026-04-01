import type { GameState, ValidPlacement } from "@pompidup/kingdomino-engine";

export type ScreenName = "title" | "config" | "game" | "results";

export type PlayerConfig = {
  name: string;
  type: "human" | "bot";
  botLevel?: string;
};

export type GameConfig = {
  mode: string;
  players: PlayerConfig[];
  extraRules: string[];
};

export type Rotation = 0 | 90 | 180 | 270;

export type CursorState = {
  x: number;
  y: number;
  rotation: Rotation;
};

export type TransitionState = {
  active: boolean;
  playerName: string;
  timeout?: number;
};

export type ErrorState = {
  code: string;
  message: string;
  timestamp: number;
};

export type AppState = {
  screen: ScreenName;
  gameState: GameState | null;
  gameConfig: GameConfig;
  cursor: CursorState;
  error: ErrorState | null;
  transition: TransitionState;
  draftSelection: number;
  validPlacements: ValidPlacement[];
  botPlaying: boolean;
};

export const SCREEN_NAMES: readonly ScreenName[] = ["title", "config", "game", "results"];

export const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];

export function isValidScreenName(value: string): value is ScreenName {
  return SCREEN_NAMES.includes(value as ScreenName);
}

export function isValidRotation(value: number): value is Rotation {
  return ROTATIONS.includes(value as Rotation);
}

export const INITIAL_CURSOR: CursorState = { x: 4, y: 4, rotation: 0 };

export const INITIAL_TRANSITION: TransitionState = { active: false, playerName: "" };

export const INITIAL_GAME_CONFIG: GameConfig = {
  mode: "Classic",
  players: [],
  extraRules: [],
};

export const INITIAL_APP_STATE: AppState = {
  screen: "title",
  gameState: null,
  gameConfig: INITIAL_GAME_CONFIG,
  cursor: INITIAL_CURSOR,
  error: null,
  transition: INITIAL_TRANSITION,
  draftSelection: 0,
  validPlacements: [],
  botPlaying: false,
};
