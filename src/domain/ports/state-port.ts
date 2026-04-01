import type { AppState } from "../types.js";

export type Action =
  | { type: "NAVIGATE"; screen: AppState["screen"] }
  | { type: "SET_GAME_STATE"; gameState: AppState["gameState"] }
  | { type: "SET_CURSOR"; cursor: Partial<AppState["cursor"]> }
  | { type: "SET_ERROR"; error: NonNullable<AppState["error"]> }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_TRANSITION"; transition: AppState["transition"] }
  | { type: "SET_DRAFT_SELECTION"; index: number }
  | { type: "SET_VALID_PLACEMENTS"; placements: AppState["validPlacements"] }
  | { type: "SET_BOT_PLAYING"; playing: boolean }
  | { type: "SET_CONFIG"; config: Partial<AppState["gameConfig"]> };

export interface StatePort {
  getState(): AppState;
  dispatch(action: Action): void;
  subscribe(listener: (state: AppState) => void): () => void;
}
