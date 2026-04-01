import { describe, it, expect } from "vitest";
import { renderTurnInfo } from "../turn-info.js";

describe("renderTurnInfo", () => {
  const baseProps = {
    turn: 3,
    playerName: "Alice",
    action: "pickDomino",
    score: 15,
    botPlaying: false,
  };

  it("renders turn number", () => {
    const [line] = renderTurnInfo(baseProps);
    expect(line.text).toContain("Turn 3");
  });

  it("renders player name", () => {
    const [line] = renderTurnInfo(baseProps);
    expect(line.text).toContain("Alice");
  });

  it("renders action label", () => {
    const [line] = renderTurnInfo(baseProps);
    expect(line.text).toContain("Pick domino");
  });

  it("renders placeDomino action", () => {
    const [line] = renderTurnInfo({ ...baseProps, action: "placeDomino" });
    expect(line.text).toContain("Place domino");
  });

  it("renders score", () => {
    const [line] = renderTurnInfo(baseProps);
    expect(line.text).toContain("Score: 15");
  });

  it("renders bot thinking when botPlaying is true", () => {
    const [line] = renderTurnInfo({ ...baseProps, botPlaying: true });
    expect(line.text).toContain("Bot thinking...");
    expect(line.text).not.toContain("Pick domino");
  });

  it("renders player color indicator", () => {
    const [line] = renderTurnInfo({ ...baseProps, playerColor: "#ff0000" });
    expect(line.text).toContain("■");
    expect(line.style?.fg).toBe("#ff0000");
  });

  it("renders without color indicator when no color", () => {
    const [line] = renderTurnInfo(baseProps);
    expect(line.text).not.toContain("■");
  });

  it("renders with bold style", () => {
    const [line] = renderTurnInfo(baseProps);
    expect(line.style?.bold).toBe(true);
  });

  it("handles unknown action gracefully", () => {
    const [line] = renderTurnInfo({ ...baseProps, action: "customAction" });
    expect(line.text).toContain("customAction");
  });
});
