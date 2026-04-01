import type { Kingdom, Domino, ValidPlacement, Tile, EmptyTile } from "@pompidup/kingdomino-engine";
import type { Rotation } from "../domain/types.js";
import type { RenderLine } from "@pompidup/cligrid";
import { renderTile } from "./terrain.js";

export type KingdomGridProps = {
  kingdom: Kingdom;
  cursorX?: number;
  cursorY?: number;
  cursorRotation?: Rotation;
  currentDomino?: Domino | null;
  validPlacements?: ValidPlacement[];
  compact?: boolean;
  ascii?: boolean;
};

function getSecondTilePosition(x: number, y: number, rotation: Rotation): { x: number; y: number } {
  switch (rotation) {
    case 0:
      return { x: x + 1, y };
    case 90:
      return { x, y: y + 1 };
    case 180:
      return { x: x - 1, y };
    case 270:
      return { x, y: y - 1 };
  }
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

export function renderKingdomGrid(props: KingdomGridProps): RenderLine[] {
  const {
    kingdom,
    cursorX,
    cursorY,
    cursorRotation = 0,
    currentDomino = null,
    validPlacements = [],
    compact = false,
    ascii = false,
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

  for (let row = 0; row < size; row++) {
    let lineText = "";
    for (let col = 0; col < size; col++) {
      const tile = kingdom[row][col] as Tile | EmptyTile;
      let highlight: "valid" | "invalid" | null = null;

      const isGhostFirst = ghostFirst?.x === col && ghostFirst?.y === row;
      const isGhostSecond = ghostSecond?.x === col && ghostSecond?.y === row;

      if (isGhostFirst && currentDomino) {
        const ghostTile = currentDomino.left;
        const rendered = renderTile(ghostTile, {
          compact,
          ascii,
          highlight: ghostValid ? "valid" : "invalid",
        });
        lineText += rendered.text;
        continue;
      }

      if (isGhostSecond && currentDomino) {
        const ghostTile = currentDomino.right;
        const rendered = renderTile(ghostTile, {
          compact,
          ascii,
          highlight: ghostValid ? "valid" : "invalid",
        });
        lineText += rendered.text;
        continue;
      }

      if (tile.type !== "empty") {
        highlight = null;
      }

      const rendered = renderTile(tile, { compact, ascii, highlight });
      lineText += compact ? rendered.text : rendered.text + " ";
    }

    lines.push({ text: lineText.trimEnd() });
  }

  return lines;
}
