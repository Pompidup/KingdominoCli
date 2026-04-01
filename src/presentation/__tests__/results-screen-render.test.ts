import { describe, it, expect } from "vitest";
import type { FinalResult, Kingdom } from "@pompidup/kingdomino-engine";
import { renderResultsScreen } from "../results-screen-render.js";

function makeFinalResult(
  overrides: Partial<FinalResult> & { playerId: string; playerName: string; position: number },
): FinalResult {
  return {
    details: { points: 30, maxPropertiesSize: 5, totalCrowns: 4 },
    ...overrides,
  };
}

function makeEmptyKingdom(): Kingdom {
  const row = Array.from({ length: 9 }, () => ({ type: "empty" as const, crowns: 0 as const }));
  return Array.from({ length: 9 }, () => [...row]);
}

describe("renderResultsScreen", () => {
  const width = 80;

  function makeResults(count: number): FinalResult[] {
    const names = ["Alice", "Bob", "Charlie", "Diana"];
    return Array.from({ length: count }, (_, i) =>
      makeFinalResult({
        playerId: `p${i + 1}`,
        playerName: names[i],
        position: i + 1,
        details: { points: 40 - i * 10, maxPropertiesSize: 5 - i, totalCrowns: 6 - i },
      }),
    );
  }

  function makeKingdoms(results: FinalResult[]): Map<string, Kingdom> {
    const map = new Map<string, Kingdom>();
    for (const r of results) {
      map.set(r.playerId, makeEmptyKingdom());
    }
    return map;
  }

  it("renders GAME OVER header", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("G A M E   O V E R");
  });

  it("renders crown decorations", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("♔");
  });

  it("renders medals for top 3 positions", () => {
    const results = makeResults(3);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("🥇");
    expect(allText).toContain("🥈");
    expect(allText).toContain("🥉");
  });

  it("renders player names", () => {
    const results = makeResults(3);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("Alice");
    expect(allText).toContain("Bob");
    expect(allText).toContain("Charlie");
  });

  it("renders scores", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("40 pts");
    expect(allText).toContain("30 pts");
  });

  it("renders score breakdown with details", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("Largest property: 5");
    expect(allText).toContain("Crowns: 6");
  });

  it("renders footer with play again and quit options", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("Enter → Play Again");
    expect(allText).toContain("Q → Quit");
  });

  it("renders 4 players with position fallback for 4th", () => {
    const results = makeResults(4);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("#4");
    expect(allText).toContain("Diana");
  });

  it("sorts results by position", () => {
    const results = [
      makeFinalResult({
        playerId: "p2",
        playerName: "Bob",
        position: 2,
        details: { points: 20, maxPropertiesSize: 3, totalCrowns: 2 },
      }),
      makeFinalResult({
        playerId: "p1",
        playerName: "Alice",
        position: 1,
        details: { points: 40, maxPropertiesSize: 5, totalCrowns: 6 },
      }),
    ];
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const allText = lines.map((l) => l.text).join("\n");
    const aliceIdx = allText.indexOf("Alice");
    const bobIdx = allText.indexOf("Bob");
    expect(aliceIdx).toBeLessThan(bobIdx);
  });

  it("uses animated scores when provided", () => {
    const results = makeResults(2);
    const animatedScores = new Map([
      ["p1", 15],
      ["p2", 10],
    ]);
    const lines = renderResultsScreen({
      results,
      playerKingdoms: makeKingdoms(results),
      width,
      animatedScores,
    });
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("15 pts");
    expect(allText).toContain("10 pts");
    expect(allText).not.toContain("40 pts");
  });

  it("returns multiple lines", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    expect(lines.length).toBeGreaterThan(10);
  });

  it("header lines have gold color styling", () => {
    const results = makeResults(2);
    const lines = renderResultsScreen({ results, playerKingdoms: makeKingdoms(results), width });
    const gameOverLine = lines.find((l) => l.text.includes("G A M E   O V E R"));
    expect(gameOverLine?.style?.fg).toBe("#f5d442");
    expect(gameOverLine?.style?.bold).toBe(true);
  });
});
