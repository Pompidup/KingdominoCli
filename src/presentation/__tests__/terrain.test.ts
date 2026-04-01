import { describe, it, expect } from "vitest";
import {
  TERRAIN_SYMBOLS,
  TERRAIN_ASCII,
  TERRAIN_COLORS,
  formatCrowns,
  renderTile,
  renderDomino,
  CROWN_SYMBOL,
  CROWN_ASCII,
} from "../terrain.js";
import type { Tile, EmptyTile, Domino } from "@pompidup/kingdomino-engine";

const ALL_TERRAINS = [
  "castle",
  "wheat",
  "forest",
  "sea",
  "plain",
  "swamp",
  "mine",
  "empty",
] as const;

describe("TERRAIN_SYMBOLS", () => {
  it.each(ALL_TERRAINS)("has a symbol for %s", (terrain) => {
    expect(TERRAIN_SYMBOLS[terrain]).toBeDefined();
    expect(TERRAIN_SYMBOLS[terrain].length).toBeGreaterThan(0);
  });
});

describe("TERRAIN_ASCII", () => {
  it.each(ALL_TERRAINS)("has an ASCII fallback for %s", (terrain) => {
    expect(TERRAIN_ASCII[terrain]).toBeDefined();
    expect(TERRAIN_ASCII[terrain]).toMatch(/^[A-Z.]$/);
  });
});

describe("TERRAIN_COLORS", () => {
  it.each(ALL_TERRAINS)("has a hex color for %s", (terrain) => {
    expect(TERRAIN_COLORS[terrain]).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("formatCrowns", () => {
  it("returns empty string for 0 crowns", () => {
    expect(formatCrowns(0)).toBe("");
  });

  it("returns one crown symbol for 1 crown", () => {
    expect(formatCrowns(1)).toBe(CROWN_SYMBOL);
  });

  it("returns multiple crown symbols", () => {
    expect(formatCrowns(3)).toBe(CROWN_SYMBOL.repeat(3));
  });

  it("uses ASCII fallback", () => {
    expect(formatCrowns(2, true)).toBe(CROWN_ASCII.repeat(2));
  });
});

describe("renderTile", () => {
  const wheatTile: Tile = { type: "wheat", crowns: 1 };
  const emptyTile: EmptyTile = { type: "empty", crowns: 0 };
  const mineTile: Tile = { type: "mine", crowns: 3 };

  it("renders a tile with symbol and crowns", () => {
    const result = renderTile(wheatTile);
    expect(result.text).toBe(`${TERRAIN_SYMBOLS.wheat}${CROWN_SYMBOL}`);
    expect(result.style?.bg).toBe(TERRAIN_COLORS.wheat);
  });

  it("renders empty tile as dim", () => {
    const result = renderTile(emptyTile);
    expect(result.text).toBe(TERRAIN_SYMBOLS.empty);
    expect(result.style?.dim).toBe(true);
  });

  it("renders tile without crowns when crowns is 0", () => {
    const tile: Tile = { type: "forest", crowns: 0 };
    const result = renderTile(tile);
    expect(result.text).toBe(TERRAIN_SYMBOLS.forest);
  });

  it("renders multiple crowns", () => {
    const result = renderTile(mineTile);
    expect(result.text).toBe(`${TERRAIN_SYMBOLS.mine}${CROWN_SYMBOL.repeat(3)}`);
  });

  it("renders compact mode (symbol only)", () => {
    const result = renderTile(wheatTile, { compact: true });
    expect(result.text).toBe(TERRAIN_SYMBOLS.wheat);
  });

  it("renders with valid highlight", () => {
    const result = renderTile(wheatTile, { highlight: "valid" });
    expect(result.style?.bg).toBe("#00aa00");
  });

  it("renders with invalid highlight", () => {
    const result = renderTile(wheatTile, { highlight: "invalid" });
    expect(result.style?.bg).toBe("#aa0000");
  });

  it("renders with ASCII fallback", () => {
    const result = renderTile(wheatTile, { ascii: true });
    expect(result.text).toBe(`${TERRAIN_ASCII.wheat}${CROWN_ASCII}`);
  });
});

describe("renderDomino", () => {
  const domino: Domino = {
    left: { type: "wheat", crowns: 0 },
    right: { type: "forest", crowns: 1 },
    number: 5,
  };

  it("renders horizontal domino as single line", () => {
    const result = renderDomino(domino);
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain("|");
  });

  it("renders vertical domino as two lines", () => {
    const result = renderDomino(domino, "vertical");
    expect(result).toHaveLength(2);
    expect(result[0].text).toBe(TERRAIN_SYMBOLS.wheat);
    expect(result[1].text).toBe(`${TERRAIN_SYMBOLS.forest}${CROWN_SYMBOL}`);
  });

  it("passes options to renderTile", () => {
    const result = renderDomino(domino, "vertical", { compact: true });
    expect(result[0].text).toBe(TERRAIN_SYMBOLS.wheat);
    expect(result[1].text).toBe(TERRAIN_SYMBOLS.forest);
  });

  it("renders ASCII domino", () => {
    const result = renderDomino(domino, "horizontal", { ascii: true });
    expect(result[0].text).toBe(`${TERRAIN_ASCII.wheat}|${TERRAIN_ASCII.forest}${CROWN_ASCII}`);
  });
});
