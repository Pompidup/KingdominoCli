import type { Kingdom, Domino, ValidPlacement, Tile, EmptyTile } from "@pompidup/kingdomino-engine";
import type { Rotation } from "../domain/types.js";
import type { RenderLine } from "@pompidup/cligrid";
import { TILE_WIDTH, TILE_HEIGHT, TERRAIN_LABELS } from "./terrain.js";
import type { HighlightType } from "./terrain.js";

export type KingdomGridProps = {
  kingdom: Kingdom;
  cursorX?: number;
  cursorY?: number;
  cursorRotation?: Rotation;
  currentDomino?: Domino | null;
  validPlacements?: ValidPlacement[];
  errorFlash?: boolean;
  compact?: boolean;
  ascii?: boolean;
};

/**
 * Get the second tile position based on engine convention:
 * - 0: left at position, right to east
 * - 90: left at position, right to south
 * - 180: right at position, left to east
 * - 270: right at position, left to south
 */
function getSecondTilePosition(x: number, y: number, rotation: Rotation): { x: number; y: number } {
  switch (rotation) {
    case 0:
      return { x: x + 1, y };
    case 90:
      return { x, y: y + 1 };
    case 180:
      return { x: x + 1, y };
    case 270:
      return { x, y: y + 1 };
  }
}

/**
 * For rotations 180/270, the engine swaps which tile is at the cursor position.
 */
function isSwappedRotation(rotation: Rotation): boolean {
  return rotation === 180 || rotation === 270;
}

function isPlacementValid(
  x: number,
  y: number,
  rotation: Rotation,
  validPlacements: ValidPlacement[],
): boolean {
  return validPlacements.some(
    (p) => p.position.x === x && p.position.y === y && p.rotation === rotation,
  );
}

function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const left = Math.floor((width - text.length) / 2);
  const right = width - text.length - left;
  return " ".repeat(left) + text + " ".repeat(right);
}

function getHighlightIndicator(highlight: HighlightType): string {
  if (highlight === "valid") return "✓";
  if (highlight === "invalid") return "✗";
  if (highlight === "error") return "!";
  return "";
}

export function renderKingdomGrid(props: KingdomGridProps): RenderLine[] {
  const {
    kingdom,
    cursorX,
    cursorY,
    cursorRotation = 0,
    currentDomino = null,
    validPlacements = [],
    errorFlash = false,
    compact = false,
  } = props;

  const lines: RenderLine[] = [];
  const size = kingdom.length;

  let ghostFirst: { x: number; y: number } | null = null;
  let ghostSecond: { x: number; y: number } | null = null;
  let ghostValid = false;

  if (cursorX !== undefined && cursorY !== undefined && currentDomino) {
    ghostFirst = { x: cursorX, y: cursorY };
    ghostSecond = getSecondTilePosition(cursorX, cursorY, cursorRotation);
    ghostValid = isPlacementValid(cursorX, cursorY, cursorRotation, validPlacements);
  }

  const linesPerRow = compact ? 1 : TILE_HEIGHT;
  const tileW = compact ? 2 : TILE_WIDTH;

  for (let row = 0; row < size; row++) {
    const rowLineTexts: string[][] = Array.from({ length: linesPerRow }, () => []);

    for (let col = 0; col < size; col++) {
      const tile = kingdom[row][col] as Tile | EmptyTile;

      const isGhostFirst = ghostFirst?.x === col && ghostFirst?.y === row;
      const isGhostSecond = ghostSecond?.x === col && ghostSecond?.y === row;

      function getGhostHighlight(): HighlightType {
        if (errorFlash) return "error";
        return ghostValid ? "valid" : "invalid";
      }

      let tileToRender: Tile | EmptyTile = tile;
      let highlight: HighlightType = null;

      if (isGhostFirst && currentDomino && tile.type === "empty") {
        const swapped = isSwappedRotation(cursorRotation);
        tileToRender = swapped ? currentDomino.right : currentDomino.left;
        highlight = getGhostHighlight();
      } else if (isGhostSecond && currentDomino && tile.type === "empty") {
        const swapped = isSwappedRotation(cursorRotation);
        tileToRender = swapped ? currentDomino.left : currentDomino.right;
        highlight = getGhostHighlight();
      }

      if (compact) {
        const label =
          tileToRender.type === "empty" ? "· " : `${TERRAIN_LABELS[tileToRender.type]} `;
        rowLineTexts[0].push(highlight ? `${getHighlightIndicator(highlight)} ` : label);
      } else {
        const crowns = tileToRender.type !== "empty" ? tileToRender.crowns : 0;
        const label = TERRAIN_LABELS[tileToRender.type];
        const highlightInd = highlight ? getHighlightIndicator(highlight) : "";

        // Line 1: terrain label + crown info, with optional highlight indicator
        let line1Content: string;
        if (highlightInd) {
          line1Content =
            crowns > 0 ? `${highlightInd}${label}${crowns}C` : `${highlightInd}${label}`;
        } else {
          line1Content = crowns > 0 ? `${label}${crowns}C` : label;
        }
        rowLineTexts[0].push(centerText(line1Content, tileW));

        // Line 2: empty or dot for empty tiles
        const line2Content = tileToRender.type === "empty" ? "·" : " ";
        rowLineTexts[1].push(centerText(line2Content, tileW));
      }
    }

    for (let l = 0; l < linesPerRow; l++) {
      const lineText = rowLineTexts[l].join("");
      const style: RenderLine["style"] = {};
      // Use a subtle dark background for the grid
      style.bg = "#1a1a2e";
      lines.push({ text: lineText, style });
    }
  }

  return lines;
}
