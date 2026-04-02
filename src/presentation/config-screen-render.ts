import type { RenderLine } from "@pompidup/cligrid";
import type { PlayerConfig } from "../domain/types.js";
import type { ExtraRule } from "@pompidup/kingdomino-engine";
import { renderLogoLines, renderCentered } from "./ascii-art.js";
import type { TranslateFn } from "../i18n/index.js";
import { THEME } from "./theme.js";

export type ConfigField =
  | "playerCount"
  | `player-${number}-name`
  | `player-${number}-type`
  | `player-${number}-botLevel`
  | `extraRule-${number}`
  | "start";

export type ConfigScreenRenderProps = {
  playerCount: number;
  players: PlayerConfig[];
  extraRules: string[];
  availableRules: ExtraRule[];
  availableStrategies: string[];
  selectedField: ConfigField;
  errors: string[];
  editingName?: { playerIndex: number; value: string } | null;
  width?: number;
  t?: TranslateFn;
};

function fieldStyle(field: ConfigField, selected: ConfigField): RenderLine["style"] {
  return field === selected ? { bold: true, fg: THEME.ui.gold } : {};
}

function indicator(field: ConfigField, selected: ConfigField): string {
  return field === selected ? "▸" : " ";
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
    editingName = null,
    width = 80,
    t,
  } = props;

  const lines: RenderLine[] = [];

  // ─── Header: ASCII art logo ───
  lines.push({ text: "" });
  const logoLines = renderLogoLines(width);
  lines.push(...logoLines);
  lines.push({ text: "" });
  const configTitle = t?.("gameConfiguration") ?? "Game Configuration";
  lines.push({
    text: renderCentered(`═══ ${configTitle} ═══`, width),
    style: { bold: true, fg: THEME.ui.gold },
  });
  lines.push({ text: "" });

  // ─── Body: Configuration options ───

  // Player count
  const countOptions = [2, 3, 4].map((n) => (n === playerCount ? `[${n}]` : ` ${n} `)).join(" ");
  const playersLabel = t?.("players") ?? "Players";
  lines.push({
    text: `  ${indicator("playerCount", selectedField)} ${playersLabel}: ${countOptions}`,
    style: fieldStyle("playerCount", selectedField),
  });
  lines.push({ text: "" });

  // Player fields
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const nameField = `player-${i}-name` as ConfigField;
    const typeField = `player-${i}-type` as ConfigField;
    const botField = `player-${i}-botLevel` as ConfigField;

    const playerLabel = t?.("player") ?? "Player";
    lines.push({
      text: `    ${playerLabel} ${i + 1}`,
      style: { bold: true, dim: true },
    });

    // Name field — inline editing
    const nameLabel = t?.("name") ?? "Name";
    let nameDisplay: string;
    if (editingName && editingName.playerIndex === i) {
      nameDisplay = editingName.value + "█";
    } else {
      nameDisplay = p.name || "___";
    }
    lines.push({
      text: `  ${indicator(nameField, selectedField)}   ${nameLabel}: ${nameDisplay}`,
      style: fieldStyle(nameField, selectedField),
    });

    // Type field — horizontal toggle with ◀ ▶ hint
    const typeFieldLabel = t?.("type") ?? "Type";
    const humanLabel = t?.("human") ?? "Human";
    const botLabel = t?.("bot") ?? "Bot";
    const typeLabel =
      p.type === "human"
        ? `◀ [${humanLabel}]  ${botLabel}  ▶`
        : `◀  ${humanLabel}  [${botLabel}] ▶`;
    lines.push({
      text: `  ${indicator(typeField, selectedField)}   ${typeFieldLabel}: ${typeLabel}`,
      style: fieldStyle(typeField, selectedField),
    });

    // Bot level
    if (p.type === "bot") {
      const levelLabel = t?.("level") ?? "Level";
      const levelDisplay = availableStrategies
        .map((s) => (s === p.botLevel ? `[${s}]` : ` ${s} `))
        .join(" ");
      lines.push({
        text: `  ${indicator(botField, selectedField)}   ${levelLabel}: ◀ ${levelDisplay} ▶`,
        style: fieldStyle(botField, selectedField),
      });
    }

    lines.push({ text: "" });
  }

  // Extra rules
  if (availableRules.length > 0) {
    const rulesLabel = t?.("extraRules") ?? "Extra Rules";
    lines.push({ text: `    ${rulesLabel}`, style: { bold: true, dim: true } });
    for (let i = 0; i < availableRules.length; i++) {
      const rule = availableRules[i];
      const ruleField = `extraRule-${i}` as ConfigField;
      const checked = extraRules.includes(rule.name) ? "☑" : "☐";
      lines.push({
        text: `  ${indicator(ruleField, selectedField)}   ${checked} ${rule.name} — ${rule.description}`,
        style: fieldStyle(ruleField, selectedField),
      });
    }
    lines.push({ text: "" });
  }

  // Start button
  const startGameLabel = t?.("startGame") ?? "Start Game";
  const startSelected = selectedField === "start";
  lines.push({
    text: startSelected
      ? renderCentered(`[ ▸ ${startGameLabel} ◂ ]`, width)
      : renderCentered(`[  ${startGameLabel}  ]`, width),
    style: startSelected ? { bold: true, fg: THEME.ui.startButton } : { dim: true },
  });

  // Errors
  if (errors.length > 0) {
    lines.push({ text: "" });
    for (const error of errors) {
      lines.push({ text: `  ⚠ ${error}`, style: { fg: THEME.ui.error.fg } });
    }
  }

  // ─── Footer: Commands ───
  lines.push({ text: "" });
  lines.push({ text: "─".repeat(width), style: { dim: true } });

  const isNameField = selectedField.endsWith("-name");
  if (isNameField && editingName) {
    lines.push({
      text: renderCentered(
        t?.("footerEditName") ??
          "Type to edit name  │  Enter: confirm  │  Esc: cancel  │  Ctrl+C: quit",
        width,
      ),
      style: { dim: true },
    });
  } else {
    lines.push({
      text: renderCentered(
        t?.("footerNav") ??
          "Tab: next field  │  ◀▶: change value  │  Space: toggle rule  │  Enter: confirm  │  Ctrl+C: quit",
        width,
      ),
      style: { dim: true },
    });
  }

  return lines;
}
