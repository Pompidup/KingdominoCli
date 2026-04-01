import type { RenderLine } from "@pompidup/cligrid";
import type { PlayerConfig } from "../domain/types.js";
import type { ExtraRule } from "@pompidup/kingdomino-engine";

export type ConfigField =
  | "playerCount"
  | `player-${number}-name`
  | `player-${number}-type`
  | `player-${number}-botLevel`
  | "extraRules"
  | "start";

export type ConfigScreenRenderProps = {
  playerCount: number;
  players: PlayerConfig[];
  extraRules: string[];
  availableRules: ExtraRule[];
  availableStrategies: string[];
  selectedField: ConfigField;
  errors: string[];
};

function fieldStyle(field: ConfigField, selected: ConfigField): RenderLine["style"] {
  return field === selected ? { bold: true, fg: "#f5d442" } : {};
}

function indicator(field: ConfigField, selected: ConfigField): string {
  return field === selected ? ">" : " ";
}

export function renderConfigScreen(props: ConfigScreenRenderProps): RenderLine[] {
  const {
    playerCount,
    players,
    extraRules,
    availableRules,
    availableStrategies,
    selectedField,
    errors,
  } = props;

  const lines: RenderLine[] = [];

  lines.push({ text: "═══ GAME CONFIGURATION ═══", style: { bold: true, fg: "#f5d442" } });
  lines.push({ text: "" });

  // Player count
  const countOptions = [2, 3, 4].map((n) => (n === playerCount ? `[${n}]` : ` ${n} `)).join(" ");
  lines.push({
    text: `${indicator("playerCount", selectedField)} Players: ${countOptions}`,
    style: fieldStyle("playerCount", selectedField),
  });
  lines.push({ text: "" });

  // Player fields
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const nameField = `player-${i}-name` as ConfigField;
    const typeField = `player-${i}-type` as ConfigField;
    const botField = `player-${i}-botLevel` as ConfigField;

    lines.push({
      text: `  Player ${i + 1}:`,
      style: { bold: true },
    });

    lines.push({
      text: `${indicator(nameField, selectedField)}   Name: ${p.name || "___"}`,
      style: fieldStyle(nameField, selectedField),
    });

    const typeLabel = p.type === "human" ? "[Human] Bot" : "Human [Bot]";
    lines.push({
      text: `${indicator(typeField, selectedField)}   Type: ${typeLabel}`,
      style: fieldStyle(typeField, selectedField),
    });

    if (p.type === "bot") {
      const levelDisplay = availableStrategies
        .map((s) => (s === p.botLevel ? `[${s}]` : ` ${s} `))
        .join(" ");
      lines.push({
        text: `${indicator(botField, selectedField)}   Level: ${levelDisplay}`,
        style: fieldStyle(botField, selectedField),
      });
    }

    lines.push({ text: "" });
  }

  // Extra rules
  if (availableRules.length > 0) {
    lines.push({ text: "  Extra Rules:", style: { bold: true } });
    for (const rule of availableRules) {
      const checked = extraRules.includes(rule.name) ? "☑" : "☐";
      lines.push({
        text: `${indicator("extraRules", selectedField)}   ${checked} ${rule.name} — ${rule.description}`,
        style: fieldStyle("extraRules", selectedField),
      });
    }
    lines.push({ text: "" });
  }

  // Start button
  lines.push({
    text: `${indicator("start", selectedField)} [ Start Game ]`,
    style: fieldStyle("start", selectedField),
  });

  // Errors
  if (errors.length > 0) {
    lines.push({ text: "" });
    for (const error of errors) {
      lines.push({ text: `  ⚠ ${error}`, style: { fg: "#ff0000" } });
    }
  }

  lines.push({ text: "" });
  lines.push({
    text: "  Tab: next field  ↑↓: change value  Enter: confirm  Ctrl+C: quit",
    style: { dim: true },
  });

  return lines;
}
