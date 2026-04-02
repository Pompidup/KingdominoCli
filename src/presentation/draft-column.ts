import type { RevealsDomino } from "@pompidup/kingdomino-engine";
import type { RenderLine } from "@pompidup/cligrid";
import { renderTile } from "./terrain.js";
import { THEME } from "./theme.js";

export type DraftColumnProps = {
  dominoes: RevealsDomino[];
  selectedIndex: number;
  playerColors?: Record<string, string>;
  playerNames?: Record<string, string>;
  errorFlashIndex?: number | null;
  ascii?: boolean;
};

export function renderDraftColumn(props: DraftColumnProps): RenderLine[] {
  const {
    dominoes,
    selectedIndex,
    playerColors = {},
    playerNames = {},
    errorFlashIndex = null,
    ascii = false,
  } = props;
  const lines: RenderLine[] = [];

  for (let i = 0; i < dominoes.length; i++) {
    const entry = dominoes[i];
    const isSelected = i === selectedIndex;
    const indicator = isSelected ? ">" : " ";
    const num = `#${String(entry.domino.number).padStart(2, " ")}`;

    const left = renderTile(entry.domino.left, { compact: true, ascii });
    const right = renderTile(entry.domino.right, { compact: true, ascii });

    let status = "";
    if (entry.picked && entry.lordId) {
      const name = playerNames[entry.lordId];
      status = name ? ` ✓ ${name}` : " ✓";
    }

    const text = `${indicator} ${num} ${left.text}|${right.text}${status}`;

    const style: RenderLine["style"] = {};
    if (errorFlashIndex === i) {
      style.bg = THEME.ui.errorFlash.bg;
      style.fg = THEME.ui.errorFlash.fg;
      style.bold = true;
    }
    if (isSelected) {
      style.bold = true;
    }
    if (entry.picked) {
      style.dim = true;
      if (entry.lordId && playerColors[entry.lordId]) {
        style.fg = playerColors[entry.lordId];
      }
    }

    lines.push({ text, style });
  }

  return lines;
}
