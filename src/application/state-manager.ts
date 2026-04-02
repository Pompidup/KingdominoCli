import type { AppState } from "../domain/types.js";
import { INITIAL_APP_STATE } from "../domain/types.js";
import type { Action, StatePort } from "../domain/ports/state-port.js";

function reduce(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "NAVIGATE":
      return { ...state, screen: action.screen };

    case "SET_GAME_STATE": {
      const oldDominoes = state.gameState?.currentDominoes ?? [];
      const newDominoes = action.gameState?.currentDominoes ?? [];
      const oldNumbers = oldDominoes
        .map((d) => d.domino.number)
        .sort()
        .join(",");
      const newNumbers = newDominoes
        .map((d) => d.domino.number)
        .sort()
        .join(",");
      const draftChanged = oldNumbers !== newNumbers && oldDominoes.length > 0;
      return {
        ...state,
        gameState: action.gameState,
        ...(draftChanged
          ? { previousDraft: oldDominoes, previousDraftTurn: state.gameState?.turn ?? 0 }
          : {}),
      };
    }

    case "SET_CURSOR":
      return { ...state, cursor: { ...state.cursor, ...action.cursor } };

    case "SET_ERROR":
      return { ...state, error: action.error };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "SET_TRANSITION":
      return { ...state, transition: action.transition };

    case "SET_DRAFT_SELECTION":
      return { ...state, draftSelection: action.index };

    case "SET_VALID_PLACEMENTS":
      return { ...state, validPlacements: action.placements };

    case "SET_BOT_PLAYING":
      return { ...state, botPlaying: action.playing };

    case "SET_CONFIG":
      return { ...state, gameConfig: { ...state.gameConfig, ...action.config } };
  }
}

export class StateManager implements StatePort {
  private state: AppState;
  private listeners: Set<(state: AppState) => void> = new Set();

  constructor(initialState: AppState = INITIAL_APP_STATE) {
    this.state = initialState;
  }

  getState(): AppState {
    return this.state;
  }

  dispatch(action: Action): void {
    this.state = reduce(this.state, action);
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
