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
import { renderLegend, renderTile } from "./terrain.js";
import type { TranslateFn } from "../i18n/index.js";

export type TransitionProps = {
  active: boolean;
  playerName: string;
  playerColor?: string;
};

export type PreviousDraftProps = {
  dominoes: DraftColumnProps["dominoes"];
  playerColors?: Record<string, string>;
  playerNames?: Record<string, string>;
  turn: number;
  ascii?: boolean;
};

export type GameLayoutProps = {
  turnInfo: TurnInfoProps;
  kingdomGrid: KingdomGridProps;
  draftColumn: DraftColumnProps;
  previousDraft?: PreviousDraftProps;
  miniKingdoms: KingdomGridProps[];
  statusBar: StatusBarProps;
  transition?: TransitionProps;
  width: number;
  height?: number;
  t?: TranslateFn;
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
    t,
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
  const leftWidth = Math.floor(width * 0.55);
  const gridLines = renderKingdomGrid(kingdomGrid);

  // Build right panel: previous draft (if any) + current draft + mini kingdoms
  const rightLines: RenderLine[] = [];

  const { previousDraft } = props;
  if (previousDraft && previousDraft.dominoes.length > 0) {
    const turnWord = t?.("turn") ?? "Turn";
    const prevLabel = `${t?.("previousTurn") ?? "Previous"} (${turnWord} ${previousDraft.turn})`;
    rightLines.push({ text: prevLabel, style: { dim: true } });
    for (const entry of previousDraft.dominoes) {
      const left = renderTile(entry.domino.left, { compact: true, ascii: previousDraft.ascii });
      const right = renderTile(entry.domino.right, { compact: true, ascii: previousDraft.ascii });
      const num = `#${String(entry.domino.number).padStart(2, " ")}`;
      const lordId = entry.lordId;
      const name = lordId && previousDraft.playerNames?.[lordId]
        ? ` ${previousDraft.playerNames[lordId]}`
        : "";
      rightLines.push({
        text: `  ${num} ${left.text}|${right.text}${name}`,
        style: {
          dim: true,
          ...(lordId && previousDraft.playerColors?.[lordId]
            ? { fg: previousDraft.playerColors[lordId] }
            : {}),
        },
      });
    }
    const currentLabel = `${t?.("currentTurn") ?? "Current"} (${turnWord} ${(previousDraft.turn ?? 0) + 1})`;
    rightLines.push({ text: "" });
    rightLines.push({ text: currentLabel, style: { bold: true } });
  }

  const draftLines = renderDraftColumn(draftColumn);
  rightLines.push(...draftLines);

  // Mini kingdoms below draft
  if (miniKingdoms.length > 0) {
    rightLines.push({ text: "" });
    for (const mk of miniKingdoms) {
      const mkLines = renderKingdomGrid({ ...mk, compact: true });
      rightLines.push(...mkLines);
      rightLines.push({ text: "" });
    }
  }

  const mainArea = mergeSideBySide(gridLines, rightLines, leftWidth);
  lines.push(...mainArea);

  // Legend
  lines.push({ text: "" });
  const legendLines = renderLegend(t);
  lines.push(...legendLines);

  // Status bar (bottom)
  lines.push({ text: "─".repeat(width) });
  const statusLines = renderStatusBar(statusBar);
  lines.push(...statusLines);

  return lines;
}
