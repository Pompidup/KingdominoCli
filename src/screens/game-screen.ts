import { App, createComponent } from "@pompidup/cligrid";
import type { ScreenName } from "../domain/types.js";
import type { StatePort } from "../domain/ports/state-port.js";
import type { GamePort } from "../domain/ports/game-port.js";
import { renderGameLayout } from "../presentation/game-screen-render.js";
import type { GameLayoutProps } from "../presentation/game-screen-render.js";
import type { StatusBarPhase } from "../presentation/status-bar.js";
import {
  getActivePlayer,
  getActiveLord,
  getCurrentAction,
  getCurrentDomino,
  getDraftDominoes,
  getKingdomForDisplay,
} from "../application/selectors.js";
import { isGameWithNextAction } from "@pompidup/kingdomino-engine";

export type GameScreenDeps = {
  statePort: StatePort;
  gamePort: GamePort;
  onNavigate: (screen: ScreenName) => void;
};

function actionToPhase(action: string | null): StatusBarPhase {
  if (action === "pickDomino") return "pick";
  if (action === "placeDomino") return "place";
  return "idle";
}

export function createGameScreen(deps: GameScreenDeps) {
  const { statePort, gamePort, onNavigate } = deps;
  const app = new App({ alternateScreen: true });
  let unsubscribe: (() => void) | null = null;

  function buildLayoutProps(): GameLayoutProps {
    const state = statePort.getState();
    const activePlayer = getActivePlayer(state);
    const currentAction = getCurrentAction(state);
    const kingdom = getKingdomForDisplay(state);
    const draftDominoes = getDraftDominoes(state);
    const currentDomino = getCurrentDomino(state);
    const score = kingdom
      ? gamePort.calculateScore(kingdom)
      : { points: 0, maxPropertiesSize: 0, totalCrowns: 0 };
    const activeLord = getActiveLord(state);

    const otherPlayers = state.gameState
      ? state.gameState.players.filter((p) => p.id !== activePlayer?.id)
      : [];

    const playerColors: Record<string, string> = {};
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];
    if (state.gameState) {
      state.gameState.lords.forEach((lord, i) => {
        playerColors[lord.id] = colors[i % colors.length];
      });
    }

    return {
      turnInfo: {
        turn: state.gameState?.turn ?? 0,
        playerName: activePlayer?.name ?? "",
        playerColor: activeLord ? playerColors[activeLord.id] : undefined,
        action: currentAction ?? "",
        score: score.points,
        botPlaying: state.botPlaying,
      },
      kingdomGrid: {
        kingdom: kingdom ?? [],
        cursorX: state.cursor.x,
        cursorY: state.cursor.y,
        cursorRotation: state.cursor.rotation,
        currentDomino: currentAction === "placeDomino" ? currentDomino : null,
        validPlacements: state.validPlacements,
      },
      draftColumn: {
        dominoes: draftDominoes,
        selectedIndex: state.draftSelection,
        playerColors,
      },
      miniKingdoms: otherPlayers.map((p) => ({
        kingdom: p.kingdom,
        compact: true,
      })),
      statusBar: {
        phase: actionToPhase(currentAction),
        error: state.error ? { message: state.error.message } : null,
      },
      width: 80,
    };
  }

  const screenComponent = createComponent({
    id: "game-screen",
    position: { x: 0, y: 0 },
    width: "100%",
    height: "100%",
    props: {} as GameLayoutProps,
    render: (props) => {
      if (!props.turnInfo) return [];
      return renderGameLayout(props);
    },
  });

  app.add(screenComponent);

  function rerender() {
    const layoutProps = buildLayoutProps();
    screenComponent.setProps(layoutProps);
  }

  // Pick phase: Up/Down to select, Enter to pick
  app.onKey("up", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    const action = getCurrentAction(state);
    if (action === "pickDomino") {
      const newIdx = Math.max(0, state.draftSelection - 1);
      statePort.dispatch({ type: "SET_DRAFT_SELECTION", index: newIdx });
    } else if (action === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { y: Math.max(0, state.cursor.y - 1) } });
    }
  });

  app.onKey("down", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    const action = getCurrentAction(state);
    if (action === "pickDomino") {
      const dominoes = getDraftDominoes(state);
      const newIdx = Math.min(dominoes.length - 1, state.draftSelection + 1);
      statePort.dispatch({ type: "SET_DRAFT_SELECTION", index: newIdx });
    } else if (action === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { y: Math.min(8, state.cursor.y + 1) } });
    }
  });

  app.onKey("left", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    if (getCurrentAction(state) === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { x: Math.max(0, state.cursor.x - 1) } });
    }
  });

  app.onKey("right", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    if (getCurrentAction(state) === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { x: Math.min(8, state.cursor.x + 1) } });
    }
  });

  app.onKey("r", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    if (getCurrentAction(state) === "placeDomino") {
      const rotations = [0, 90, 180, 270] as const;
      const currentIdx = rotations.indexOf(state.cursor.rotation);
      const nextRotation = rotations[(currentIdx + 1) % 4];
      statePort.dispatch({ type: "SET_CURSOR", cursor: { rotation: nextRotation } });
    }
  });

  app.onKey("enter", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    const action = getCurrentAction(state);
    const gameState = state.gameState;
    if (!gameState || !isGameWithNextAction(gameState)) return;
    const lordId = getActiveLord(state)?.id;
    if (!lordId) return;

    if (action === "pickDomino") {
      const dominoes = getDraftDominoes(state);
      const selected = dominoes[state.draftSelection];
      if (selected && !selected.picked) {
        const result = gamePort.chooseDomino(gameState, selected.domino.number, lordId);
        if (result.ok) {
          statePort.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
        } else {
          statePort.dispatch({
            type: "SET_ERROR",
            error: {
              code: result.error.code,
              message: result.error.message,
              timestamp: Date.now(),
            },
          });
        }
      }
    } else if (action === "placeDomino") {
      const result = gamePort.placeDomino(
        gameState,
        lordId,
        { x: state.cursor.x, y: state.cursor.y },
        state.cursor.rotation,
      );
      if (result.ok) {
        statePort.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
      } else {
        statePort.dispatch({
          type: "SET_ERROR",
          error: { code: result.error.code, message: result.error.message, timestamp: Date.now() },
        });
      }
    }
  });

  app.onKey("d", () => {
    const state = statePort.getState();
    if (state.botPlaying) return;
    const action = getCurrentAction(state);
    const gameState = state.gameState;
    if (!gameState || !isGameWithNextAction(gameState)) return;
    const lordId = getActiveLord(state)?.id;
    if (!lordId) return;

    if (action === "placeDomino") {
      const result = gamePort.discardDomino(gameState, lordId);
      if (result.ok) {
        statePort.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
      }
    }
  });

  app.onKey("ctrl+c", () => {
    stop();
  });

  function start() {
    rerender();
    unsubscribe = statePort.subscribe(() => {
      rerender();
      // Check for game end
      const state = statePort.getState();
      if (state.gameState && !isGameWithNextAction(state.gameState)) {
        const nextAction = state.gameState.nextAction;
        if (nextAction.type === "step" && nextAction.step === "result") {
          stop();
          onNavigate("results");
        }
      }
    });
    app.start();
  }

  function stop() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (app.isRunning) {
      app.stop();
    }
  }

  return { start, stop };
}
