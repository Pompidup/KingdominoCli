import type { Tile, EmptyTile, Ground, Domino } from "@pompidup/kingdomino-engine";
import type { RenderLine, Style } from "@pompidup/cligrid";

type TerrainType = Ground | "empty";

export const TERRAIN_SYMBOLS: Record<TerrainType, string> = {
  castle: "🏰",
  wheat: "🌾",
  forest: "🌲",
  sea: "🌊",
  plain: "🌿",
  swamp: "🏚",
  mine: "⛏",
  empty: "·",
};

export const TERRAIN_ASCII: Record<TerrainType, string> = {
  castle: "C",
  wheat: "W",
  forest: "F",
  sea: "S",
  plain: "P",
  swamp: "X",
  mine: "M",
  empty: ".",
};

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  castle: "#c0c0c0",
  wheat: "#f5d442",
  forest: "#228b22",
  sea: "#1e90ff",
  plain: "#90ee90",
  swamp: "#8b7355",
  mine: "#4a4a4a",
  empty: "#1a1a1a",
};

export const CROWN_SYMBOL = "👑";
export const CROWN_ASCII = "*";

export function formatCrowns(crowns: number, ascii = false): string {
  if (crowns === 0) return "";
  const symbol = ascii ? CROWN_ASCII : CROWN_SYMBOL;
  return symbol.repeat(crowns);
}

export type RenderTileOptions = {
  compact?: boolean;
  highlight?: "valid" | "invalid" | "error" | null;
  ascii?: boolean;
};

export function renderTile(tile: Tile | EmptyTile, options: RenderTileOptions = {}): RenderLine {
  const { compact = false, highlight = null, ascii = false } = options;
  const symbols = ascii ? TERRAIN_ASCII : TERRAIN_SYMBOLS;
  const symbol = symbols[tile.type];
  const crowns = tile.type !== "empty" ? formatCrowns(tile.crowns, ascii) : "";
  const text = compact ? symbol : `${symbol}${crowns}`;

  const style: Partial<Style> = {
    bg: TERRAIN_COLORS[tile.type],
  };

  if (tile.type === "empty") {
    style.dim = true;
  }

  if (highlight === "valid") {
    style.bg = "#00aa00";
  } else if (highlight === "invalid") {
    style.bg = "#aa0000";
  } else if (highlight === "error") {
    style.bg = "#cc0000";
    style.bold = true;
  }

  return { text, style };
}

export type RenderDominoOrientation = "horizontal" | "vertical";

export function renderDomino(
  domino: Domino,
  orientation: RenderDominoOrientation = "horizontal",
  options: RenderTileOptions = {},
): RenderLine[] {
  const left = renderTile(domino.left, options);
  const right = renderTile(domino.right, options);

  if (orientation === "horizontal") {
    return [{ text: `${left.text}|${right.text}`, style: {} }];
  }

  return [left, right];
}
