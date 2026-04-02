import { App, createComponent } from "@pompidup/cligrid";
import { INITIAL_CURSOR } from "../domain/types.js";
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
import type { BotPort } from "../domain/ports/bot-port.js";
import type { GameEngine, RevealsDomino } from "@pompidup/kingdomino-engine";
import { isGameWithNextAction } from "@pompidup/kingdomino-engine";
import { mapErrorToFeedback } from "../application/error-feedback.js";
import type { TranslateFn } from "../i18n/index.js";

export type GameScreenDeps = {
  statePort: StatePort;
  gamePort: GamePort;
  botPort: BotPort;
  getEngine: () => GameEngine;
  onNavigate: (screen: ScreenName) => void;
  t?: TranslateFn;
};

export function findNextUnpickedIndex(
  dominoes: RevealsDomino[],
  currentIdx: number,
  direction: 1 | -1,
): number {
  let idx = currentIdx + direction;
  while (idx >= 0 && idx < dominoes.length) {
    if (!dominoes[idx].picked) return idx;
    idx += direction;
  }
  return currentIdx;
}

function actionToPhase(action: string | null): StatusBarPhase {
  if (action === "pickDomino") return "pick";
  if (action === "placeDomino") return "place";
  return "idle";
}

export function createGameScreen(deps: GameScreenDeps) {
  const { statePort, gamePort, botPort, getEngine, onNavigate, t } = deps;
  const app = new App({ alternateScreen: true });
  let unsubscribe: (() => void) | null = null;
  let prevGameState: unknown = null;
  let prevPlayerId: string | null = null;
  let transitionTimeout: ReturnType<typeof setTimeout> | null = null;
  let errorClearTimeout: ReturnType<typeof setTimeout> | null = null;
  let placementFlash: "placed" | "discarded" | null = null;
  let placementFlashTimeout: ReturnType<typeof setTimeout> | null = null;

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
    const playerNames: Record<string, string> = {};
    const colors = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"];
    if (state.gameState) {
      state.gameState.lords.forEach((lord, i) => {
        playerColors[lord.id] = colors[i % colors.length];
        const player = state.gameState!.players.find((p) => p.id === lord.playerId);
        if (player) playerNames[lord.id] = player.name;
      });
    }

    const feedback = state.error ? mapErrorToFeedback(state.error.code, state.error.message) : null;

    return {
      turnInfo: {
        turn: state.gameState?.turn ?? 0,
        playerName: activePlayer?.name ?? "",
        playerColor: activeLord ? playerColors[activeLord.id] : undefined,
        action: currentAction ?? "",
        score: score.points,
        botPlaying: state.botPlaying,
        t,
      },
      kingdomGrid: {
        kingdom: kingdom ?? [],
        cursorX: state.cursor.x,
        cursorY: state.cursor.y,
        cursorRotation: state.cursor.rotation,
        currentDomino: currentAction === "placeDomino" ? currentDomino : null,
        validPlacements: state.validPlacements,
        errorFlash: feedback?.target === "cursor" && feedback.flash,
      },
      draftColumn: {
        dominoes: draftDominoes,
        selectedIndex: state.draftSelection,
        playerColors,
        playerNames,
        errorFlashIndex: feedback?.target === "draft" ? state.draftSelection : null,
      },
      previousDraft:
        state.previousDraft.length > 0
          ? {
              dominoes: state.previousDraft,
              playerColors,
              playerNames,
              turn: state.previousDraftTurn,
            }
          : undefined,
      miniKingdoms: otherPlayers.map((p) => ({
        kingdom: p.kingdom,
        compact: true,
      })),
      statusBar: {
        phase: actionToPhase(currentAction),
        t,
        error:
          placementFlash === "placed"
            ? { message: "Domino placed!" }
            : placementFlash === "discarded"
              ? { message: "Domino discarded" }
              : feedback && feedback.target !== "debugOnly"
                ? { message: feedback.message }
                : null,
        errorFlash: placementFlash === "discarded" || (feedback?.flash ?? false),
        successFlash: placementFlash === "placed",
      },
      transition: {
        active: state.transition.active,
        playerName: state.transition.playerName,
        playerColor: activeLord ? playerColors[activeLord.id] : undefined,
      },
      width: 80,
      t,
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

  function triggerPlacementFlash(type: "placed" | "discarded") {
    if (placementFlashTimeout) clearTimeout(placementFlashTimeout);
    placementFlash = type;
    rerender();
    placementFlashTimeout = setTimeout(() => {
      placementFlash = null;
      placementFlashTimeout = null;
      rerender();
    }, 300);
  }

  function rerender() {
    const layoutProps = buildLayoutProps();
    screenComponent.setProps(layoutProps);
  }

  // Pick phase: Up/Down to select, Enter to pick
  app.onKey("up", () => {
    const state = statePort.getState();
    if (state.botPlaying || state.transition.active) return;
    const action = getCurrentAction(state);
    if (action === "pickDomino") {
      const dominoes = getDraftDominoes(state);
      const newIdx = findNextUnpickedIndex(dominoes, state.draftSelection, -1);
      statePort.dispatch({ type: "SET_DRAFT_SELECTION", index: newIdx });
    } else if (action === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { y: Math.max(0, state.cursor.y - 1) } });
    }
  });

  app.onKey("down", () => {
    const state = statePort.getState();
    if (state.botPlaying || state.transition.active) return;
    const action = getCurrentAction(state);
    if (action === "pickDomino") {
      const dominoes = getDraftDominoes(state);
      const newIdx = findNextUnpickedIndex(dominoes, state.draftSelection, 1);
      statePort.dispatch({ type: "SET_DRAFT_SELECTION", index: newIdx });
    } else if (action === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { y: Math.min(8, state.cursor.y + 1) } });
    }
  });

  app.onKey("left", () => {
    const state = statePort.getState();
    if (state.botPlaying || state.transition.active) return;
    if (getCurrentAction(state) === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { x: Math.max(0, state.cursor.x - 1) } });
    }
  });

  app.onKey("right", () => {
    const state = statePort.getState();
    if (state.botPlaying || state.transition.active) return;
    if (getCurrentAction(state) === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: { x: Math.min(8, state.cursor.x + 1) } });
    }
  });

  app.onKey("r", () => {
    const state = statePort.getState();
    if (state.botPlaying || state.transition.active) return;
    if (getCurrentAction(state) === "placeDomino") {
      const rotations = [0, 90, 180, 270] as const;
      const currentIdx = rotations.indexOf(state.cursor.rotation);
      const nextRotation = rotations[(currentIdx + 1) % 4];
      statePort.dispatch({ type: "SET_CURSOR", cursor: { rotation: nextRotation } });
    }
  });

  app.onKey("enter", () => {
    const state = statePort.getState();
    if (state.botPlaying || state.transition.active) return;
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
          checkAndRunBots();
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
        triggerPlacementFlash("placed");
        statePort.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
        checkAndRunBots();
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
    if (state.botPlaying || state.transition.active) return;
    const action = getCurrentAction(state);
    const gameState = state.gameState;
    if (!gameState || !isGameWithNextAction(gameState)) return;
    const lordId = getActiveLord(state)?.id;
    if (!lordId) return;

    if (action === "placeDomino") {
      const kingdom = getKingdomForDisplay(state);
      const domino = getCurrentDomino(state);
      if (kingdom && domino && gamePort.canPlaceDomino(kingdom, domino)) {
        statePort.dispatch({
          type: "SET_ERROR",
          error: {
            code: "CAN_STILL_PLACE",
            message: t?.("canStillPlace") ?? "You can still place this domino",
            timestamp: Date.now(),
          },
        });
        return;
      }
      const result = gamePort.discardDomino(gameState, lordId);
      if (result.ok) {
        triggerPlacementFlash("discarded");
        statePort.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
        checkAndRunBots();
      }
    }
  });

  app.onKey("ctrl+c", () => {
    stop();
  });

  async function runBotLoop() {
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    statePort.dispatch({ type: "SET_BOT_PLAYING", playing: true });

    let state = statePort.getState();
    while (
      state.gameState &&
      isGameWithNextAction(state.gameState) &&
      botPort.isBotTurn(state.gameState)
    ) {
      await delay(400);
      state = statePort.getState();
      if (!state.gameState || !isGameWithNextAction(state.gameState)) break;
      const result = botPort.playBotTurn(getEngine(), state.gameState);
      if (result.ok) {
        statePort.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
      } else {
        statePort.dispatch({
          type: "SET_ERROR",
          error: { code: result.error.code, message: result.error.message, timestamp: Date.now() },
        });
        break;
      }
      await delay(200);
      state = statePort.getState();
    }

    statePort.dispatch({ type: "SET_BOT_PLAYING", playing: false });
  }

  let botCheckScheduled = false;

  function checkAndRunBots() {
    const state = statePort.getState();
    if (
      !state.botPlaying &&
      state.gameState &&
      isGameWithNextAction(state.gameState) &&
      botPort.isBotTurn(state.gameState)
    ) {
      runBotLoop();
    }
  }

  function scheduleCheckBots() {
    if (botCheckScheduled) return;
    botCheckScheduled = true;
    setTimeout(() => {
      botCheckScheduled = false;
      checkAndRunBots();
    }, 0);
  }

  function handlePlayerTransition() {
    const state = statePort.getState();
    const activePlayer = getActivePlayer(state);
    const currentPlayerId = activePlayer?.id ?? null;
    const isBot = activePlayer?.bot != null;

    if (
      currentPlayerId &&
      currentPlayerId !== prevPlayerId &&
      prevPlayerId !== null &&
      !state.botPlaying &&
      !isBot
    ) {
      if (transitionTimeout) clearTimeout(transitionTimeout);
      statePort.dispatch({
        type: "SET_TRANSITION",
        transition: { active: true, playerName: activePlayer?.name ?? "" },
      });
      transitionTimeout = setTimeout(() => {
        statePort.dispatch({
          type: "SET_TRANSITION",
          transition: { active: false, playerName: "" },
        });
        transitionTimeout = null;
      }, 800);
    }

    prevPlayerId = currentPlayerId;
  }

  function handlePhaseTransition() {
    const state = statePort.getState();
    if (state.gameState === prevGameState) return;
    prevGameState = state.gameState;

    handlePlayerTransition();

    const action = getCurrentAction(state);
    if (action === "pickDomino") {
      const dominoes = getDraftDominoes(state);
      const firstUnpicked = dominoes.findIndex((d) => !d.picked);
      if (firstUnpicked >= 0) {
        statePort.dispatch({ type: "SET_DRAFT_SELECTION", index: firstUnpicked });
      }
    } else if (action === "placeDomino") {
      statePort.dispatch({ type: "SET_CURSOR", cursor: INITIAL_CURSOR });
      const kingdom = getKingdomForDisplay(state);
      const domino = getCurrentDomino(state);
      if (kingdom && domino) {
        const placements = gamePort.getValidPlacements(kingdom, domino);
        statePort.dispatch({ type: "SET_VALID_PLACEMENTS", placements });
      }
    }
  }

  function handleErrorAutoClear() {
    const state = statePort.getState();
    if (state.error) {
      if (errorClearTimeout) clearTimeout(errorClearTimeout);
      errorClearTimeout = setTimeout(() => {
        statePort.dispatch({ type: "CLEAR_ERROR" });
        errorClearTimeout = null;
      }, 1500);
    }
  }

  function start() {
    rerender();
    checkAndRunBots();
    unsubscribe = statePort.subscribe(() => {
      rerender();
      handlePhaseTransition();
      handleErrorAutoClear();
      // Check for game end
      const state = statePort.getState();
      if (state.gameState && !isGameWithNextAction(state.gameState)) {
        const nextAction = state.gameState.nextAction;
        if (nextAction.type === "step" && nextAction.step === "result") {
          stop();
          onNavigate("results");
        }
      }
      // Deferred bot check — ensures bot plays after any state change
      scheduleCheckBots();
    });
    app.start();
  }

  function stop() {
    if (transitionTimeout) {
      clearTimeout(transitionTimeout);
      transitionTimeout = null;
    }
    if (errorClearTimeout) {
      clearTimeout(errorClearTimeout);
      errorClearTimeout = null;
    }
    if (placementFlashTimeout) {
      clearTimeout(placementFlashTimeout);
      placementFlashTimeout = null;
    }
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
