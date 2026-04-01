import { App, createComponent } from "@pompidup/cligrid";
import type { GameConfig, PlayerConfig, ScreenName } from "../domain/types.js";
import type { GamePort } from "../domain/ports/game-port.js";
import type { BotPort } from "../domain/ports/bot-port.js";
import { renderConfigScreen } from "../presentation/config-screen-render.js";
import type { ConfigField } from "../presentation/config-screen-render.js";
import { validateGameConfig } from "../application/config-validator.js";

export type ConfigScreenDeps = {
  gamePort: GamePort;
  botPort: BotPort;
  onNavigate: (screen: ScreenName) => void;
  onStartGame: (config: GameConfig) => void;
};

function createDefaultPlayers(count: number): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Player${i + 1}`,
    type: "human" as const,
  }));
}

function getFieldList(playerCount: number, players: PlayerConfig[]): ConfigField[] {
  const fields: ConfigField[] = ["playerCount"];
  for (let i = 0; i < playerCount; i++) {
    fields.push(`player-${i}-name`);
    fields.push(`player-${i}-type`);
    if (players[i]?.type === "bot") {
      fields.push(`player-${i}-botLevel`);
    }
  }
  fields.push("extraRules");
  fields.push("start");
  return fields;
}

export function createConfigScreen(deps: ConfigScreenDeps) {
  const { gamePort, botPort, onStartGame } = deps;
  const app = new App({ alternateScreen: true });

  let playerCount = 2;
  let players = createDefaultPlayers(playerCount);
  let extraRules: string[] = [];
  let selectedFieldIndex = 0;
  let errors: string[] = [];

  const strategies = botPort.getStrategyNames();
  const availableRules = gamePort.getExtraRules("Classic", playerCount);

  function getFields(): ConfigField[] {
    return getFieldList(playerCount, players);
  }

  function getSelectedField(): ConfigField {
    const fields = getFields();
    return fields[Math.min(selectedFieldIndex, fields.length - 1)];
  }

  function rerender() {
    screenComponent.setProps({
      playerCount,
      players,
      extraRules,
      availableRules,
      availableStrategies: strategies,
      selectedField: getSelectedField(),
      errors,
    });
  }

  const screenComponent = createComponent({
    id: "config-screen",
    position: { x: 0, y: 0 },
    width: "100%",
    height: "100%",
    props: {
      playerCount,
      players,
      extraRules,
      availableRules,
      availableStrategies: strategies,
      selectedField: "playerCount" as ConfigField,
      errors: [] as string[],
    },
    render: (props) => renderConfigScreen(props),
  });

  app.add(screenComponent);

  app.onKey("tab", () => {
    const fields = getFields();
    selectedFieldIndex = (selectedFieldIndex + 1) % fields.length;
    rerender();
  });

  app.onKey("up", () => {
    handleValueChange(-1);
  });

  app.onKey("down", () => {
    handleValueChange(1);
  });

  app.onKey("enter", () => {
    const field = getSelectedField();
    if (field === "start") {
      const config: GameConfig = { mode: "Classic", players, extraRules };
      const validation = validateGameConfig(config);
      if (validation.valid) {
        errors = [];
        stop();
        onStartGame(config);
      } else {
        errors = validation.errors;
        rerender();
      }
    }
  });

  app.onKey("space", () => {
    const field = getSelectedField();
    if (field === "extraRules") {
      // Toggle first available rule (simplified — could be expanded)
      if (availableRules.length > 0) {
        const ruleName = availableRules[0].name;
        if (extraRules.includes(ruleName)) {
          extraRules = extraRules.filter((r) => r !== ruleName);
        } else {
          extraRules = [...extraRules, ruleName];
        }
        rerender();
      }
    }
  });

  app.onKey("ctrl+c", () => {
    stop();
  });

  function handleValueChange(direction: number) {
    const field = getSelectedField();

    if (field === "playerCount") {
      playerCount = Math.max(2, Math.min(4, playerCount + direction));
      if (players.length < playerCount) {
        players = [...players, ...createDefaultPlayers(playerCount - players.length)];
      } else if (players.length > playerCount) {
        players = players.slice(0, playerCount);
      }
      rerender();
      return;
    }

    const playerMatch = field.match(/^player-(\d+)-(.+)$/);
    if (playerMatch) {
      const idx = parseInt(playerMatch[1], 10);
      const prop = playerMatch[2];

      if (prop === "type") {
        players = players.map((p, i) =>
          i === idx
            ? {
                ...p,
                type: p.type === "human" ? "bot" : "human",
                botLevel: p.type === "human" ? strategies[0] : undefined,
              }
            : p,
        );
        rerender();
      } else if (prop === "botLevel" && players[idx]?.type === "bot") {
        const currentIdx = strategies.indexOf(players[idx].botLevel ?? strategies[0]);
        const newIdx = Math.max(0, Math.min(strategies.length - 1, currentIdx + direction));
        players = players.map((p, i) => (i === idx ? { ...p, botLevel: strategies[newIdx] } : p));
        rerender();
      }
    }
  }

  function start() {
    app.start();
  }

  function stop() {
    if (app.isRunning) {
      app.stop();
    }
  }

  return { start, stop };
}
