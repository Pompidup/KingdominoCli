import { describe, it, expect } from "vitest";
import {
  TERRAIN_LABELS,
  TERRAIN_COLORS,
  TERRAIN_FG,
  renderTile,
  renderTileSegment,
  renderDomino,
  renderLegend,
  TILE_HEIGHT,
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

describe("TERRAIN_LABELS", () => {
  it.each(ALL_TERRAINS)("has a label for %s", (terrain) => {
    expect(TERRAIN_LABELS[terrain]).toBeDefined();
  });
});

describe("TERRAIN_COLORS", () => {
  it.each(ALL_TERRAINS)("has a hex color for %s", (terrain) => {
    expect(TERRAIN_COLORS[terrain]).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("TERRAIN_FG", () => {
  it.each(ALL_TERRAINS)("has a foreground color for %s", (terrain) => {
    expect(TERRAIN_FG[terrain]).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("renderTileSegment", () => {
  const wheatTile: Tile = { type: "wheat", crowns: 1 };
  const emptyTile: EmptyTile = { type: "empty", crowns: 0 };

  it("returns TILE_HEIGHT lines in normal mode", () => {
    const segments = renderTileSegment(wheatTile);
    expect(segments).toHaveLength(TILE_HEIGHT);
  });

  it("returns 1 line in compact mode", () => {
    const segments = renderTileSegment(wheatTile, { compact: true });
    expect(segments).toHaveLength(1);
  });

  it("includes crown label for tiles with crowns", () => {
    const segments = renderTileSegment(wheatTile);
    expect(segments[0].text).toContain("1C");
  });

  it("does not include crown label for 0 crowns", () => {
    const tile: Tile = { type: "forest", crowns: 0 };
    const segments = renderTileSegment(tile);
    expect(segments[0].text).not.toContain("C");
  });

  it("renders empty tile segments", () => {
    const segments = renderTileSegment(emptyTile);
    expect(segments).toHaveLength(TILE_HEIGHT);
  });

  it("renders with highlight override", () => {
    const segments = renderTileSegment(wheatTile, { highlight: "valid" });
    expect(segments).toHaveLength(TILE_HEIGHT);
    // The ANSI output should contain the green highlight color code
  });
});

describe("renderTile (legacy)", () => {
  const wheatTile: Tile = { type: "wheat", crowns: 1 };
  const emptyTile: EmptyTile = { type: "empty", crowns: 0 };

  it("returns a RenderLine with text and style", () => {
    const result = renderTile(wheatTile);
    expect(result.text).toContain(TERRAIN_LABELS.wheat);
    expect(result.text).toContain("1C");
    expect(result.style?.bg).toBe(TERRAIN_COLORS.wheat);
  });

  it("renders empty tile as dim", () => {
    const result = renderTile(emptyTile);
    expect(result.style?.dim).toBe(true);
  });

  it("renders compact mode (label + crowns)", () => {
    const result = renderTile(wheatTile, { compact: true });
    expect(result.text).toBe("W1");
  });

  it("renders compact mode without crowns (label only)", () => {
    const noCrownTile: Tile = { type: "wheat", crowns: 0 };
    const result = renderTile(noCrownTile, { compact: true });
    expect(result.text).toBe(TERRAIN_LABELS.wheat);
  });

  it("renders with valid highlight", () => {
    const result = renderTile(wheatTile, { highlight: "valid" });
    expect(result.style?.bg).toBe("#00aa00");
  });

  it("renders with invalid highlight", () => {
    const result = renderTile(wheatTile, { highlight: "invalid" });
    expect(result.style?.bg).toBe("#aa0000");
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
  });
});

describe("renderLegend", () => {
  it("returns legend lines", () => {
    const lines = renderLegend();
    expect(lines.length).toBeGreaterThan(0);
    // Legend should contain terrain names
    expect(lines[0].text).toContain("Wheat");
    expect(lines[0].text).toContain("Forest");
  });
});
