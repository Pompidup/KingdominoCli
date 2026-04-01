import { describe, it, expect } from "vitest";
import { renderTransitionOverlay } from "../transition-overlay.js";

describe("renderTransitionOverlay", () => {
  it("returns exactly height lines", () => {
    const lines = renderTransitionOverlay({
      playerName: "Alice",
      width: 80,
      height: 24,
    });
    expect(lines).toHaveLength(24);
  });

  it("centers player name on the middle line", () => {
    const lines = renderTransitionOverlay({
      playerName: "Alice",
      width: 40,
      height: 10,
    });
    const centerIdx = 5; // Math.floor(10 / 2)
    expect(lines[centerIdx].text).toContain("Alice");
    expect(lines[centerIdx].style?.bold).toBe(true);
  });

  it("renders decorative lines above and below the name", () => {
    const lines = renderTransitionOverlay({
      playerName: "Bob",
      width: 40,
      height: 10,
    });
    const centerIdx = 5;
    expect(lines[centerIdx - 1].text).toContain("♚");
    expect(lines[centerIdx - 1].text).toContain("Bob");
    expect(lines[centerIdx + 1].text).toContain("♚");
    expect(lines[centerIdx + 1].text).toContain("Bob");
  });

  it("applies dim style to non-center lines", () => {
    const lines = renderTransitionOverlay({
      playerName: "Alice",
      width: 40,
      height: 10,
    });
    expect(lines[0].style?.dim).toBe(true);
    expect(lines[lines.length - 1].style?.dim).toBe(true);
  });

  it("applies player color as fg on the name line", () => {
    const lines = renderTransitionOverlay({
      playerName: "Alice",
      playerColor: "#ff6b6b",
      width: 40,
      height: 10,
    });
    const centerIdx = 5;
    expect(lines[centerIdx].style?.fg).toBe("#ff6b6b");
  });

  it("works without player color", () => {
    const lines = renderTransitionOverlay({
      playerName: "Alice",
      width: 40,
      height: 10,
    });
    const centerIdx = 5;
    expect(lines[centerIdx].style?.fg).toBeUndefined();
  });
});
