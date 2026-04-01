import { describe, it, expect } from "vitest";
import {
  isValidScreenName,
  isValidRotation,
  INITIAL_APP_STATE,
  SCREEN_NAMES,
  ROTATIONS,
} from "../types.js";

describe("isValidScreenName", () => {
  it.each(["title", "config", "game", "results"])('returns true for "%s"', (name) => {
    expect(isValidScreenName(name)).toBe(true);
  });

  it.each(["unknown", "", "TITLE", "Title"])('returns false for "%s"', (name) => {
    expect(isValidScreenName(name)).toBe(false);
  });
});

describe("isValidRotation", () => {
  it.each([0, 90, 180, 270])("returns true for %d", (rotation) => {
    expect(isValidRotation(rotation)).toBe(true);
  });

  it.each([45, 360, -90, 1])("returns false for %d", (rotation) => {
    expect(isValidRotation(rotation)).toBe(false);
  });
});

describe("INITIAL_APP_STATE", () => {
  it("has correct default values", () => {
    expect(INITIAL_APP_STATE.screen).toBe("title");
    expect(INITIAL_APP_STATE.gameState).toBeNull();
    expect(INITIAL_APP_STATE.cursor).toEqual({ x: 4, y: 4, rotation: 0 });
    expect(INITIAL_APP_STATE.error).toBeNull();
    expect(INITIAL_APP_STATE.transition.active).toBe(false);
    expect(INITIAL_APP_STATE.draftSelection).toBe(0);
    expect(INITIAL_APP_STATE.validPlacements).toEqual([]);
    expect(INITIAL_APP_STATE.botPlaying).toBe(false);
  });

  it("has correct game config defaults", () => {
    expect(INITIAL_APP_STATE.gameConfig.mode).toBe("Classic");
    expect(INITIAL_APP_STATE.gameConfig.players).toEqual([]);
    expect(INITIAL_APP_STATE.gameConfig.extraRules).toEqual([]);
  });
});

describe("constants", () => {
  it("SCREEN_NAMES contains all screens", () => {
    expect(SCREEN_NAMES).toEqual(["title", "config", "game", "results"]);
  });

  it("ROTATIONS contains all valid rotations", () => {
    expect(ROTATIONS).toEqual([0, 90, 180, 270]);
  });
});
