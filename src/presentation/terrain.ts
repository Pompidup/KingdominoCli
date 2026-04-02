import type { Tile, EmptyTile, Ground, Domino } from "@pompidup/kingdomino-engine";
import type { RenderLine, Style } from "@pompidup/cligrid";
import type { TranslateFn } from "../i18n/index.js";
import { THEME } from "./theme.js";

type TerrainType = Ground | "empty";

export const TILE_WIDTH = 4;
export const TILE_HEIGHT = 2;

export const TERRAIN_LABELS: Record<TerrainType, string> = {
  castle: "♔",
  wheat: "W",
  forest: "F",
  sea: "S",
  plain: "P",
  swamp: "X",
  mine: "M",
  empty: " ",
};

export const TERRAIN_COLORS: Record<TerrainType, string> = THEME.terrain.bg;

export const TERRAIN_FG: Record<TerrainType, string> = THEME.terrain.fg;

export type TerrainLegendKey =
  | "terrainCastle"
  | "terrainWheat"
  | "terrainForest"
  | "terrainSea"
  | "terrainPlain"
  | "terrainSwamp"
  | "terrainMine";

export const TERRAIN_LEGEND: { type: TerrainType; key: TerrainLegendKey; fallback: string }[] = [
  { type: "castle", key: "terrainCastle", fallback: "Castle" },
  { type: "wheat", key: "terrainWheat", fallback: "Wheat" },
  { type: "forest", key: "terrainForest", fallback: "Forest" },
  { type: "sea", key: "terrainSea", fallback: "Sea" },
  { type: "plain", key: "terrainPlain", fallback: "Plain" },
  { type: "swamp", key: "terrainSwamp", fallback: "Swamp" },
  { type: "mine", key: "terrainMine", fallback: "Mine" },
];

function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

export type HighlightType = "valid" | "invalid" | "error" | null;

function getHighlightBg(highlight: HighlightType): string | null {
  if (highlight === "valid") return THEME.highlight.valid;
  if (highlight === "invalid") return THEME.highlight.invalid;
  if (highlight === "error") return THEME.highlight.error;
  return null;
}

export type RenderTileOptions = {
  compact?: boolean;
  highlight?: HighlightType;
  ascii?: boolean;
};

/**
 * Render a tile as plain text segments (no ANSI codes).
 * Returns an array of { text, style } objects, one per line of the tile.
 * - Normal mode: TILE_WIDTH × TILE_HEIGHT (4×2)
 * - Compact mode: 2×1 (for mini kingdoms)
 */
export function renderTileSegment(
  tile: Tile | EmptyTile,
  options: RenderTileOptions = {},
): { text: string; style: Partial<Style> }[] {
  const { compact = false, highlight = null } = options;
  const bg = getHighlightBg(highlight) ?? TERRAIN_COLORS[tile.type];
  const fg = TERRAIN_FG[tile.type];
  const bold = highlight === "error" || tile.type !== "empty";

  if (compact) {
    const label = tile.type === "empty" ? "· " : `${TERRAIN_LABELS[tile.type]} `;
    return [{ text: label, style: { bg, fg, bold } }];
  }

  const width = TILE_WIDTH;
  const crowns = tile.type !== "empty" ? tile.crowns : 0;
  const label = TERRAIN_LABELS[tile.type];
  const line1Label = crowns > 0 ? `${label}${crowns}C` : label;

  // Line 1: terrain label + crown info combined
  const line1Text = centerText(line1Label, width);
  // Line 2: empty space
  const line2Text = " ".repeat(width);

  const style: Partial<Style> = { bg, fg, bold };

  return [
    { text: line1Text, style },
    { text: line2Text, style },
  ];
}

/**
 * Legacy renderTile — kept for compatibility with draft-column and other consumers.
 */
export function renderTile(tile: Tile | EmptyTile, options: RenderTileOptions = {}): RenderLine {
  const { compact = false, highlight = null } = options;
  const bg = getHighlightBg(highlight) ?? TERRAIN_COLORS[tile.type];
  const fg = TERRAIN_FG[tile.type];
  const bold = highlight === "error";

  const crowns = tile.type !== "empty" ? tile.crowns : 0;
  const crownLabel = crowns > 0 ? `${crowns}C` : "";
  const label = TERRAIN_LABELS[tile.type];
  const text = compact ? (crowns > 0 ? `${label}${crowns}` : label) : `${label}${crownLabel}`;

  const style: Partial<Style> = { bg, fg };
  if (tile.type === "empty") style.dim = true;
  if (bold) style.bold = true;

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

/**
 * Render the terrain legend as text.
 */
export function renderLegend(t?: TranslateFn): RenderLine[] {
  const parts: string[] = [];
  for (const entry of TERRAIN_LEGEND) {
    const label = t?.(entry.key) ?? entry.fallback;
    parts.push(`${TERRAIN_LABELS[entry.type]}=${label}`);
  }
  return [{ text: parts.join("  "), style: { dim: true } }];
}
