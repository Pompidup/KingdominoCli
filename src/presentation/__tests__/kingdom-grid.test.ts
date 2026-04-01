import { describe, it, expect } from "vitest";
import { renderKingdomGrid } from "../kingdom-grid.js";
import type { Kingdom, Domino, Tile, EmptyTile } from "@pompidup/kingdomino-engine";
import { TERRAIN_SYMBOLS, TERRAIN_ASCII } from "../terrain.js";

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
    it("renders a 9x9 grid with 9 lines", () => {
      const kingdom = createEmptyKingdom();
      const lines = renderKingdomGrid({ kingdom });
      expect(lines).toHaveLength(9);
    });

    it("renders empty tiles with empty symbol", () => {
      const kingdom = createEmptyKingdom();
      const lines = renderKingdomGrid({ kingdom });
      expect(lines[0].text).toContain(TERRAIN_SYMBOLS.empty);
    });

    it("renders castle tile at center", () => {
      const kingdom = createKingdomWithCastle();
      const lines = renderKingdomGrid({ kingdom });
      expect(lines[4].text).toContain(TERRAIN_SYMBOLS.castle);
    });
  });

  describe("compact mode", () => {
    it("renders compact tiles (no spacing)", () => {
      const kingdom = createEmptyKingdom(3);
      const lines = renderKingdomGrid({ kingdom, compact: true });
      expect(lines).toHaveLength(3);
      lines.forEach((line) => {
        expect(line.text).toBe(TERRAIN_SYMBOLS.empty.repeat(3));
      });
    });
  });

  describe("ASCII mode", () => {
    it("renders ASCII symbols", () => {
      const kingdom = createKingdomWithCastle();
      const lines = renderKingdomGrid({ kingdom, ascii: true });
      expect(lines[4].text).toContain(TERRAIN_ASCII.castle);
      expect(lines[0].text).toContain(TERRAIN_ASCII.empty);
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
      expect(lines[2].text).toContain(TERRAIN_SYMBOLS.wheat);
      expect(lines[2].text).toContain(TERRAIN_SYMBOLS.forest);
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
      expect(lines[2].text).toContain(TERRAIN_SYMBOLS.wheat);
      expect(lines[3].text).toContain(TERRAIN_SYMBOLS.forest);
    });
  });

  describe("with placed tiles", () => {
    it("renders placed tiles with terrain symbols", () => {
      const kingdom = createEmptyKingdom();
      (kingdom[3][3] as unknown as Tile) = { type: "sea", crowns: 2 };
      const lines = renderKingdomGrid({ kingdom });
      expect(lines[3].text).toContain(TERRAIN_SYMBOLS.sea);
    });
  });
});
