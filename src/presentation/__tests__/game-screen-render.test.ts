import { describe, it, expect } from "vitest";
import { renderGameLayout } from "../game-screen-render.js";
import type { GameLayoutProps } from "../game-screen-render.js";
import type { Kingdom, EmptyTile } from "@pompidup/kingdomino-engine";

function createEmptyKingdom(size = 9): Kingdom {
  const empty: EmptyTile = { type: "empty", crowns: 0 };
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ({ ...empty })));
}

const baseProps: GameLayoutProps = {
  turnInfo: {
    turn: 1,
    playerName: "Alice",
    action: "pickDomino",
    score: 0,
    botPlaying: false,
  },
  kingdomGrid: {
    kingdom: createEmptyKingdom(),
  },
  draftColumn: {
    dominoes: [
      {
        domino: {
          left: { type: "wheat", crowns: 0 },
          right: { type: "forest", crowns: 1 },
          number: 1,
        },
        picked: false,
        lordId: null,
        position: 0,
      },
    ],
    selectedIndex: 0,
  },
  miniKingdoms: [],
  statusBar: { phase: "pick" },
  width: 80,
};

describe("renderGameLayout", () => {
  it("returns multiple lines", () => {
    const lines = renderGameLayout(baseProps);
    expect(lines.length).toBeGreaterThan(5);
  });

  it("includes turn info at the top", () => {
    const lines = renderGameLayout(baseProps);
    expect(lines[0].text).toContain("Alice");
    expect(lines[0].text).toContain("Turn 1");
  });

  it("includes separator lines", () => {
    const lines = renderGameLayout(baseProps);
    const separators = lines.filter((l) => l.text.includes("─────"));
    expect(separators.length).toBeGreaterThanOrEqual(2);
  });

  it("includes status bar at the bottom", () => {
    const lines = renderGameLayout(baseProps);
    const lastLine = lines[lines.length - 1];
    expect(lastLine.text).toContain("Navigate");
  });

  it("includes draft column content", () => {
    const lines = renderGameLayout(baseProps);
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("#");
  });

  it("renders with mini kingdoms", () => {
    const props: GameLayoutProps = {
      ...baseProps,
      miniKingdoms: [{ kingdom: createEmptyKingdom(3), compact: true }],
    };
    const lines = renderGameLayout(props);
    expect(lines.length).toBeGreaterThanOrEqual(renderGameLayout(baseProps).length);
  });

  it("renders place phase status bar", () => {
    const props: GameLayoutProps = {
      ...baseProps,
      statusBar: { phase: "place" },
    };
    const lines = renderGameLayout(props);
    const lastLine = lines[lines.length - 1];
    expect(lastLine.text).toContain("Move");
  });
});
