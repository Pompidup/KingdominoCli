import type { RenderLine } from "@pompidup/cligrid";
import type { TurnInfoProps } from "./turn-info.js";
import type { KingdomGridProps } from "./kingdom-grid.js";
import type { DraftColumnProps } from "./draft-column.js";
import type { StatusBarProps } from "./status-bar.js";
import { renderTurnInfo } from "./turn-info.js";
import { renderKingdomGrid } from "./kingdom-grid.js";
import { renderDraftColumn } from "./draft-column.js";
import { renderStatusBar } from "./status-bar.js";
import { renderTransitionOverlay } from "./transition-overlay.js";

export type TransitionProps = {
  active: boolean;
  playerName: string;
  playerColor?: string;
};

export type GameLayoutProps = {
  turnInfo: TurnInfoProps;
  kingdomGrid: KingdomGridProps;
  draftColumn: DraftColumnProps;
  miniKingdoms: KingdomGridProps[];
  statusBar: StatusBarProps;
  transition?: TransitionProps;
  width: number;
  height?: number;
};

function padRight(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  return text + " ".repeat(width - text.length);
}

function mergeSideBySide(
  leftLines: RenderLine[],
  rightLines: RenderLine[],
  leftWidth: number,
  separator = " │ ",
): RenderLine[] {
  const maxLen = Math.max(leftLines.length, rightLines.length);
  const merged: RenderLine[] = [];

  for (let i = 0; i < maxLen; i++) {
    const leftText = leftLines[i]?.text ?? "";
    const rightText = rightLines[i]?.text ?? "";
    merged.push({
      text: padRight(leftText, leftWidth) + separator + rightText,
    });
  }

  return merged;
}

export function renderGameLayout(props: GameLayoutProps): RenderLine[] {
  const {
    turnInfo,
    kingdomGrid,
    draftColumn,
    miniKingdoms,
    statusBar,
    transition,
    width,
    height = 24,
  } = props;

  if (transition?.active) {
    return renderTransitionOverlay({
      playerName: transition.playerName,
      playerColor: transition.playerColor,
      width,
      height,
    });
  }
  const lines: RenderLine[] = [];

  // Turn info (top bar)
  const turnLines = renderTurnInfo(turnInfo);
  lines.push(...turnLines);
  lines.push({ text: "─".repeat(width) });

  // Main area: kingdom grid (left) | draft + mini kingdoms (right)
  const leftWidth = Math.floor(width * 0.6);
  const gridLines = renderKingdomGrid(kingdomGrid);
  const draftLines = renderDraftColumn(draftColumn);

  // Mini kingdoms below draft
  const miniLines: RenderLine[] = [];
  if (miniKingdoms.length > 0) {
    miniLines.push({ text: "" });
    for (const mk of miniKingdoms) {
      const mkLines = renderKingdomGrid({ ...mk, compact: true });
      miniLines.push(...mkLines);
      miniLines.push({ text: "" });
    }
  }

  const rightLines = [...draftLines, ...miniLines];
  const mainArea = mergeSideBySide(gridLines, rightLines, leftWidth);
  lines.push(...mainArea);

  // Status bar (bottom)
  lines.push({ text: "─".repeat(width) });
  const statusLines = renderStatusBar(statusBar);
  lines.push(...statusLines);

  return lines;
}
