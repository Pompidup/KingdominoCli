import { App, createComponent } from "@pompidup/cligrid";
import type { StatePort } from "../domain/ports/state-port.js";
import type { GamePort } from "../domain/ports/game-port.js";
import type { FinalResult, Kingdom } from "@pompidup/kingdomino-engine";
import {
  renderResultsScreen,
  type ResultsScreenProps,
} from "../presentation/results-screen-render.js";

export type ResultsScreenDeps = {
  statePort: StatePort;
  gamePort: GamePort;
  onPlayAgain: () => void;
  onQuit: () => void;
};

export function createResultsScreen(deps: ResultsScreenDeps) {
  const { statePort, gamePort, onPlayAgain, onQuit } = deps;
  const app = new App({ alternateScreen: true });
  let scoreAnimInterval: ReturnType<typeof setInterval> | null = null;

  let finalResults: FinalResult[] = [];
  let playerKingdoms = new Map<string, Kingdom>();
  const animatedScores = new Map<string, number>();
  let animationDone = false;

  const screenComponent = createComponent({
    id: "results-screen",
    position: { x: 0, y: 0 },
    width: "100%",
    height: "100%",
    props: {} as ResultsScreenProps,
    render: (props, context) => {
      if (!props.results) return [];
      const width = context?.terminalWidth ?? 80;
      return renderResultsScreen({ ...props, width });
    },
  });

  app.add(screenComponent);

  app.onKey("enter", () => {
    stop();
    onPlayAgain();
  });

  app.onKey("q", () => {
    stop();
    onQuit();
  });

  app.onKey("ctrl+c", () => {
    stop();
    onQuit();
  });

  function rerender() {
    screenComponent.setProps({
      results: finalResults,
      playerKingdoms,
      width: 80,
      animatedScores: animationDone ? undefined : animatedScores,
    });
  }

  function startScoreAnimation() {
    const totalSteps = 30;
    const intervalMs = 1500 / totalSteps;
    let step = 0;

    for (const r of finalResults) {
      animatedScores.set(r.playerId, 0);
    }
    rerender();

    scoreAnimInterval = setInterval(() => {
      step++;
      const progress = step / totalSteps;

      for (const r of finalResults) {
        const target = r.details.points;
        animatedScores.set(r.playerId, Math.round(target * Math.min(progress, 1)));
      }

      rerender();

      if (step >= totalSteps) {
        if (scoreAnimInterval) {
          clearInterval(scoreAnimInterval);
          scoreAnimInterval = null;
        }
        animationDone = true;
        rerender();
      }
    }, intervalMs);
  }

  function loadResults() {
    const state = statePort.getState();
    if (!state.gameState) return;

    const result = gamePort.getResults(state.gameState);
    if (!result.ok) return;

    finalResults = result.value.result;

    const kingdoms = new Map<string, Kingdom>();
    for (const player of state.gameState.players) {
      kingdoms.set(player.id, player.kingdom);
    }
    playerKingdoms = kingdoms;
  }

  function start() {
    loadResults();
    app.start();
    startScoreAnimation();
  }

  function stop() {
    if (scoreAnimInterval) {
      clearInterval(scoreAnimInterval);
      scoreAnimInterval = null;
    }
    if (app.isRunning) {
      app.stop();
    }
  }

  return { start, stop };
}
