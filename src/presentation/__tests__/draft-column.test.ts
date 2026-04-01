import { describe, it, expect } from "vitest";
import { renderDraftColumn } from "../draft-column.js";
import type { RevealsDomino } from "@pompidup/kingdomino-engine";

const makeDomino = (num: number, picked = false, lordId: string | null = null): RevealsDomino => ({
  domino: {
    left: { type: "wheat", crowns: 0 },
    right: { type: "forest", crowns: 1 },
    number: num,
  },
  picked,
  lordId,
  position: num,
});

describe("renderDraftColumn", () => {
  const dominoes = [makeDomino(1), makeDomino(5), makeDomino(12), makeDomino(24)];

  it("renders one line per domino", () => {
    const lines = renderDraftColumn({ dominoes, selectedIndex: 0 });
    expect(lines).toHaveLength(4);
  });

  it("shows > indicator for selected domino", () => {
    const lines = renderDraftColumn({ dominoes, selectedIndex: 1 });
    expect(lines[1].text).toMatch(/^>/);
    expect(lines[0].text).toMatch(/^ /);
  });

  it("shows domino number", () => {
    const lines = renderDraftColumn({ dominoes, selectedIndex: 0 });
    expect(lines[0].text).toContain("# 1");
    expect(lines[1].text).toContain("# 5");
    expect(lines[2].text).toContain("#12");
  });

  it("selected domino has bold style", () => {
    const lines = renderDraftColumn({ dominoes, selectedIndex: 2 });
    expect(lines[2].style?.bold).toBe(true);
    expect(lines[0].style?.bold).toBeUndefined();
  });

  it("shows ✓ for picked dominoes", () => {
    const picked = [makeDomino(1, true, "lord-1"), makeDomino(5)];
    const lines = renderDraftColumn({ dominoes: picked, selectedIndex: 0 });
    expect(lines[0].text).toContain("✓");
    expect(lines[1].text).not.toContain("✓");
  });

  it("dims picked dominoes", () => {
    const picked = [makeDomino(1, true, "lord-1"), makeDomino(5)];
    const lines = renderDraftColumn({ dominoes: picked, selectedIndex: 0 });
    expect(lines[0].style?.dim).toBe(true);
    expect(lines[1].style?.dim).toBeUndefined();
  });

  it("uses player color for picked domino", () => {
    const picked = [makeDomino(1, true, "lord-1")];
    const colors = { "lord-1": "#ff0000" };
    const lines = renderDraftColumn({ dominoes: picked, selectedIndex: 0, playerColors: colors });
    expect(lines[0].style?.fg).toBe("#ff0000");
  });

  it("renders with ASCII fallback", () => {
    const lines = renderDraftColumn({ dominoes: [makeDomino(1)], selectedIndex: 0, ascii: true });
    expect(lines[0].text).toContain("W|F");
  });

  it("renders empty domino list", () => {
    const lines = renderDraftColumn({ dominoes: [], selectedIndex: 0 });
    expect(lines).toHaveLength(0);
  });

  it("applies error flash style to specified index", () => {
    const lines = renderDraftColumn({ dominoes, selectedIndex: 0, errorFlashIndex: 1 });
    expect(lines[1].style?.bg).toBe("#660000");
    expect(lines[1].style?.fg).toBe("#ff0000");
    expect(lines[0].style?.bg).toBeUndefined();
  });
});
