#!/usr/bin/env node

import { createGameEngine } from "@pompidup/kingdomino-engine";
import { EngineAdapter } from "./infrastructure/engine-adapter.js";
import { BotAdapter } from "./infrastructure/bot-adapter.js";
import { StateManager } from "./application/state-manager.js";
import { orchestrateGameSetup } from "./application/game-orchestrator.js";
import { createTitleScreen } from "./screens/title-screen.js";
import { createConfigScreen } from "./screens/config-screen.js";
import { createGameScreen } from "./screens/game-screen.js";
import type { GameConfig } from "./domain/types.js";

const engine = createGameEngine({});
const engineAdapter = new EngineAdapter(engine);
const botAdapter = new BotAdapter();
const stateManager = new StateManager();

let activeScreen: { stop: () => void } | null = null;

function stopActive() {
  if (activeScreen) {
    activeScreen.stop();
    activeScreen = null;
  }
}

function startGame(config: GameConfig) {
  const result = orchestrateGameSetup({ gamePort: engineAdapter }, config);
  if (!result.ok) {
    console.error(`Failed to start game: ${result.error.message}`);
    process.exit(1);
  }

  stateManager.dispatch({ type: "SET_GAME_STATE", gameState: result.value });
  stateManager.dispatch({ type: "NAVIGATE", screen: "game" });

  const gameScreen = createGameScreen({
    statePort: stateManager,
    gamePort: engineAdapter,
    botPort: botAdapter,
    getEngine: () => engineAdapter.getEngine(),
    onNavigate: (screen) => {
      stopActive();
      if (screen === "results") {
        // Results screen will be implemented in Phase 6
        console.log("Game Over! Results screen coming soon.");
        process.exit(0);
      }
    },
  });

  activeScreen = gameScreen;
  gameScreen.start();
}

const configScreen = createConfigScreen({
  gamePort: engineAdapter,
  botPort: botAdapter,
  onNavigate: () => {},
  onStartGame: (config: GameConfig) => {
    stopActive();
    startGame(config);
  },
});

const titleScreen = createTitleScreen({
  onNavigate: () => {
    stopActive();
    activeScreen = configScreen;
    configScreen.start();
  },
});

activeScreen = titleScreen;
titleScreen.start();
