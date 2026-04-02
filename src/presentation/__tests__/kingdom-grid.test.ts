import { describe, it, expect } from "vitest";
import { renderKingdomGrid } from "../kingdom-grid.js";
import type { Kingdom, Domino, Tile, EmptyTile } from "@pompidup/kingdomino-engine";
import { TILE_HEIGHT } from "../terrain.js";

function createEmptyKingdom(size = 9): Kingdom {
  const empty: EmptyTile = { type: "empty", crowns: 0 };
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ({ ...empty })));
}

function createKingdomWithCastle(): Kingdom {
  const kingdom = createEmptyKingdom();
  (kingdom[4][4] as unknown as Tile) = { type: "castle", crowns: 0 };
  return kingdom;
}

const testDomino: Domino = {
  left: { type: "wheat", crowns: 0 },
  right: { type: "forest", crowns: 1 },
  number: 5,
};

describe("renderKingdomGrid", () => {
  describe("basic rendering", () => {
    it("renders a 9x9 grid with 9 * TILE_HEIGHT lines", () => {
      const kingdom = createEmptyKingdom();
      const lines = renderKingdomGrid({ kingdom });
      expect(lines).toHaveLength(9 * TILE_HEIGHT);
    });

    it("renders castle tile at center row", () => {
      const kingdom = createKingdomWithCastle();
      const lines = renderKingdomGrid({ kingdom });
      // Castle is at row 4, which occupies lines 4*TILE_HEIGHT to 4*TILE_HEIGHT+1
      const castleLineStart = 4 * TILE_HEIGHT;
      const castleLines = lines.slice(castleLineStart, castleLineStart + TILE_HEIGHT);
      // ANSI output should differ from pure empty rows
      const emptyLine = lines[0].text;
      const hasCastleContent = castleLines.some((l) => l.text !== emptyLine);
      expect(hasCastleContent).toBe(true);
    });
  });

  describe("compact mode", () => {
    it("renders compact tiles (1 line per row)", () => {
      const kingdom = createEmptyKingdom(3);
      const lines = renderKingdomGrid({ kingdom, compact: true });
      expect(lines).toHaveLength(3);
    });
  });

  describe("ghost preview", () => {
    it("renders ghost domino at cursor position", () => {
      const kingdom = createEmptyKingdom();
      const lines = renderKingdomGrid({
        kingdom,
        cursorX: 3,
        cursorY: 2,
        cursorRotation: 0,
        currentDomino: testDomino,
        validPlacements: [{ position: { x: 3, y: 2 }, rotation: 0 }],
      });
      // Row 2 should contain styled ghost tiles (different from empty)
      const ghostRowStart = 2 * TILE_HEIGHT;
      const emptyRowStart = 0;
      const ghostLine = lines[ghostRowStart].text;
      const emptyLine = lines[emptyRowStart].text;
      expect(ghostLine).not.toBe(emptyLine);
    });

    it("renders ghost without domino does nothing", () => {
      const kingdom = createEmptyKingdom();
      const withGhost = renderKingdomGrid({
        kingdom,
        cursorX: 3,
        cursorY: 2,
      });
      const without = renderKingdomGrid({ kingdom });
      expect(withGhost).toEqual(without);
    });

    it("renders vertical ghost (rotation 90)", () => {
      const kingdom = createEmptyKingdom();
      const lines = renderKingdomGrid({
        kingdom,
        cursorX: 3,
        cursorY: 2,
        cursorRotation: 90,
        currentDomino: testDomino,
        validPlacements: [{ position: { x: 3, y: 2 }, rotation: 90 }],
      });
      // Rows 2 and 3 should both have ghost content
      const row2Start = 2 * TILE_HEIGHT;
      const row3Start = 3 * TILE_HEIGHT;
      const emptyRowStart = 0;
      expect(lines[row2Start].text).not.toBe(lines[emptyRowStart].text);
      expect(lines[row3Start].text).not.toBe(lines[emptyRowStart].text);
    });

    it("does not overwrite occupied tiles with ghost", () => {
      const kingdom = createEmptyKingdom();
      // Place tiles at BOTH ghost positions so neither gets overwritten
      (kingdom[2][3] as unknown as Tile) = { type: "sea", crowns: 0 };
      (kingdom[2][4] as unknown as Tile) = { type: "wheat", crowns: 1 };
      const withGhost = renderKingdomGrid({
        kingdom,
        cursorX: 3,
        cursorY: 2,
        cursorRotation: 0,
        currentDomino: testDomino,
        validPlacements: [],
      });
      const withoutGhost = renderKingdomGrid({ kingdom });
      // Both positions occupied → line should be identical
      const row2Start = 2 * TILE_HEIGHT;
      expect(withGhost[row2Start].text).toBe(withoutGhost[row2Start].text);
    });
  });

  describe("with placed tiles", () => {
    it("renders placed tiles differently from empty tiles", () => {
      const kingdom = createEmptyKingdom();
      (kingdom[3][3] as unknown as Tile) = { type: "sea", crowns: 2 };
      const lines = renderKingdomGrid({ kingdom });
      const seaRowStart = 3 * TILE_HEIGHT;
      const emptyRowStart = 0;
      expect(lines[seaRowStart].text).not.toBe(lines[emptyRowStart].text);
    });
  });
});
