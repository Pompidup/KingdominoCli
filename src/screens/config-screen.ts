import { App, createComponent } from "@pompidup/cligrid";
import type { GameConfig, PlayerConfig, ScreenName } from "../domain/types.js";
import type { GamePort } from "../domain/ports/game-port.js";
import type { BotPort } from "../domain/ports/bot-port.js";
import { renderConfigScreen } from "../presentation/config-screen-render.js";
import type { ConfigField } from "../presentation/config-screen-render.js";
import { validateGameConfig } from "../application/config-validator.js";
import type { TranslateFn } from "../i18n/index.js";

export type ConfigScreenDeps = {
  gamePort: GamePort;
  botPort: BotPort;
  onNavigate: (screen: ScreenName) => void;
  onStartGame: (config: GameConfig) => void;
  t?: TranslateFn;
};

const MAX_NAME_LENGTH = 15;

function createDefaultPlayers(count: number): PlayerConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `Player${i + 1}`,
    type: "human" as const,
  }));
}

function getFieldList(playerCount: number, players: PlayerConfig[], availableRulesCount: number): ConfigField[] {
  const fields: ConfigField[] = ["playerCount"];
  for (let i = 0; i < playerCount; i++) {
    fields.push(`player-${i}-name`);
    fields.push(`player-${i}-type`);
    if (players[i]?.type === "bot") {
      fields.push(`player-${i}-botLevel`);
    }
  }
  for (let i = 0; i < availableRulesCount; i++) {
    fields.push(`extraRule-${i}`);
  }
  fields.push("start");
  return fields;
}

export function createConfigScreen(deps: ConfigScreenDeps) {
  const { gamePort, botPort, onStartGame, t } = deps;
  const app = new App({ alternateScreen: true });

  let playerCount = 2;
  let players = createDefaultPlayers(playerCount);
  let extraRules: string[] = [];
  let selectedFieldIndex = 0;
  let errors: string[] = [];
  let editingName: { playerIndex: number; value: string } | null = null;

  const strategies = botPort.getStrategyNames();
  const availableRules = gamePort.getExtraRules("Classic", playerCount);

  function getFields(): ConfigField[] {
    return getFieldList(playerCount, players, availableRules.length);
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
      editingName,
      t,
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
      editingName: null as { playerIndex: number; value: string } | null,
      t,
    },
    render: (props) => renderConfigScreen(props),
  });

  app.add(screenComponent);

  // ─── Tab: navigate fields ───
  app.onKey("tab", () => {
    if (editingName) return; // Block navigation while editing name
    const fields = getFields();
    selectedFieldIndex = (selectedFieldIndex + 1) % fields.length;
    rerender();
  });

  // ─── Up/Down: change playerCount or navigate draft ───
  app.onKey("up", () => {
    if (editingName) return;
    const field = getSelectedField();
    if (field === "playerCount") {
      handlePlayerCountChange(-1);
    }
  });

  app.onKey("down", () => {
    if (editingName) return;
    const field = getSelectedField();
    if (field === "playerCount") {
      handlePlayerCountChange(1);
    }
  });

  // ─── Left/Right: toggle type, bot level, player count ───
  app.onKey("left", () => {
    if (editingName) return;
    handleValueChange(-1);
  });

  app.onKey("right", () => {
    if (editingName) return;
    handleValueChange(1);
  });

  // ─── Enter: start editing name, confirm edit, or start game ───
  app.onKey("enter", () => {
    const field = getSelectedField();

    if (editingName) {
      // Confirm name edit
      const idx = editingName.playerIndex;
      players = players.map((p, i) =>
        i === idx ? { ...p, name: editingName!.value } : p,
      );
      editingName = null;
      rerender();
      return;
    }

    const nameMatch = field.match(/^player-(\d+)-name$/);
    if (nameMatch) {
      const idx = parseInt(nameMatch[1], 10);
      editingName = { playerIndex: idx, value: players[idx].name };
      rerender();
      return;
    }

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

  // ─── Escape: cancel name edit ───
  app.onKey("escape", () => {
    if (editingName) {
      editingName = null;
      rerender();
    }
  });

  // ─── Space: toggle extra rules ───
  app.onKey("space", () => {
    if (editingName) return;
    const field = getSelectedField();
    const ruleMatch = field.match(/^extraRule-(\d+)$/);
    if (ruleMatch) {
      const ruleIdx = parseInt(ruleMatch[1], 10);
      const rule = availableRules[ruleIdx];
      if (rule) {
        if (extraRules.includes(rule.name)) {
          extraRules = extraRules.filter((r) => r !== rule.name);
        } else {
          extraRules = [...extraRules, rule.name];
        }
        rerender();
      }
    }
  });

  // ─── Text input for name editing ───
  app.onKey("backspace", () => {
    if (editingName) {
      editingName = { ...editingName, value: editingName.value.slice(0, -1) };
      rerender();
    }
  });

  // Register printable character handlers for name editing
  const printableChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 _-";
  for (const char of printableChars) {
    app.onKey(char, () => {
      if (!editingName) return;
      if (editingName.value.length < MAX_NAME_LENGTH) {
        editingName = { ...editingName, value: editingName.value + char };
        rerender();
      }
    });
  }

  app.onKey("ctrl+c", () => {
    stop();
  });

  function handlePlayerCountChange(direction: number) {
    playerCount = Math.max(2, Math.min(4, playerCount + direction));
    if (players.length < playerCount) {
      players = [...players, ...createDefaultPlayers(playerCount - players.length)];
    } else if (players.length > playerCount) {
      players = players.slice(0, playerCount);
    }
    rerender();
  }

  function handleValueChange(direction: number) {
    const field = getSelectedField();

    if (field === "playerCount") {
      handlePlayerCountChange(direction);
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
