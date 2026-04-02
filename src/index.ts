import { createGameEngine, wrapWithDebug } from "@pompidup/kingdomino-engine";
import { EngineAdapter } from "./infrastructure/engine-adapter.js";
import { BotAdapter } from "./infrastructure/bot-adapter.js";
import { StateManager } from "./application/state-manager.js";
import { orchestrateGameSetup } from "./application/game-orchestrator.js";
import { createTitleScreen } from "./screens/title-screen.js";
import { createLanguageScreen } from "./screens/language-screen.js";
import { createConfigScreen } from "./screens/config-screen.js";
import { createGameScreen } from "./screens/game-screen.js";
import { createResultsScreen } from "./screens/results-screen.js";
import type { GameConfig } from "./domain/types.js";
import { parseArgs, HELP_TEXT } from "./cli.js";
import { createTranslate } from "./i18n/index.js";
import type { Locale, TranslateFn } from "./i18n/index.js";

const VERSION = "0.1.0";

const cliOptions = parseArgs(process.argv);

if (cliOptions.help) {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (cliOptions.version) {
  console.log(`kingdomino v${VERSION}`);
  process.exit(0);
}

const baseEngine = createGameEngine({});
const engine = cliOptions.debug ? wrapWithDebug(baseEngine) : baseEngine;
const engineAdapter = new EngineAdapter(engine);
const botAdapter = new BotAdapter();
const stateManager = new StateManager();

let activeScreen: { stop: () => void } | null = null;
let t: TranslateFn = createTranslate("en");

function stopActive() {
  if (activeScreen) {
    activeScreen.stop();
    activeScreen = null;
  }
}

function startConfigScreen() {
  const configScreen = createConfigScreen({
    gamePort: engineAdapter,
    botPort: botAdapter,
    onNavigate: () => {},
    onStartGame: (config: GameConfig) => {
      stopActive();
      startGame(config);
    },
    t,
  });
  activeScreen = configScreen;
  configScreen.start();
}

function showResults() {
  const resultsScreen = createResultsScreen({
    statePort: stateManager,
    gamePort: engineAdapter,
    onPlayAgain: () => {
      stopActive();
      startConfigScreen();
    },
    onQuit: () => {
      stopActive();
      process.exit(0);
    },
    t,
  });
  activeScreen = resultsScreen;
  resultsScreen.start();
}

function startGame(config: GameConfig) {
  const result = orchestrateGameSetup({ gamePort: engineAdapter }, config);
  if (!result.ok) {
    console.error(`Failed to start game: ${result.error.message}`);
    process.exit(1);
    return;
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
        showResults();
      }
    },
    t,
  });

  activeScreen = gameScreen;
  gameScreen.start();
}

function showLanguageSelection() {
  const languageScreen = createLanguageScreen({
    onSelect: (locale: Locale) => {
      t = createTranslate(locale);
      stopActive();
      showTitleScreen();
    },
  });
  activeScreen = languageScreen;
  languageScreen.start();
}

function showTitleScreen() {
  const titleScreen = createTitleScreen({
    onNavigate: () => {
      stopActive();
      startConfigScreen();
    },
    t,
  });
  activeScreen = titleScreen;
  titleScreen.start();
}

// Start with language selection
showLanguageSelection();
