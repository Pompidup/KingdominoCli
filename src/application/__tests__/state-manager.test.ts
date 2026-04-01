import { describe, it, expect, vi } from "vitest";
import { StateManager } from "../state-manager.js";
import { INITIAL_APP_STATE } from "../../domain/types.js";
import type { GameState } from "@pompidup/kingdomino-engine";

describe("StateManager", () => {
  it("has initial state by default", () => {
    const manager = new StateManager();
    expect(manager.getState()).toEqual(INITIAL_APP_STATE);
  });

  it("accepts custom initial state", () => {
    const custom = { ...INITIAL_APP_STATE, screen: "config" as const };
    const manager = new StateManager(custom);
    expect(manager.getState().screen).toBe("config");
  });

  describe("NAVIGATE", () => {
    it("changes screen", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "NAVIGATE", screen: "game" });
      expect(manager.getState().screen).toBe("game");
    });
  });

  describe("SET_GAME_STATE", () => {
    it("sets game state", () => {
      const manager = new StateManager();
      const fakeGame = { id: "g1" } as unknown as GameState;
      manager.dispatch({ type: "SET_GAME_STATE", gameState: fakeGame });
      expect(manager.getState().gameState).toBe(fakeGame);
    });

    it("sets game state to null", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_GAME_STATE", gameState: null });
      expect(manager.getState().gameState).toBeNull();
    });
  });

  describe("SET_CURSOR", () => {
    it("updates cursor position partially", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_CURSOR", cursor: { x: 2 } });
      expect(manager.getState().cursor).toEqual({ x: 2, y: 4, rotation: 0 });
    });

    it("updates rotation", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_CURSOR", cursor: { rotation: 90 } });
      expect(manager.getState().cursor.rotation).toBe(90);
    });
  });

  describe("SET_ERROR / CLEAR_ERROR", () => {
    it("sets error", () => {
      const manager = new StateManager();
      const error = { code: "TEST", message: "test error", timestamp: 123 };
      manager.dispatch({ type: "SET_ERROR", error });
      expect(manager.getState().error).toEqual(error);
    });

    it("clears error", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_ERROR", error: { code: "X", message: "x", timestamp: 1 } });
      manager.dispatch({ type: "CLEAR_ERROR" });
      expect(manager.getState().error).toBeNull();
    });
  });

  describe("SET_TRANSITION", () => {
    it("sets transition state", () => {
      const manager = new StateManager();
      manager.dispatch({
        type: "SET_TRANSITION",
        transition: { active: true, playerName: "Alice" },
      });
      expect(manager.getState().transition).toEqual({ active: true, playerName: "Alice" });
    });
  });

  describe("SET_DRAFT_SELECTION", () => {
    it("sets draft selection index", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_DRAFT_SELECTION", index: 3 });
      expect(manager.getState().draftSelection).toBe(3);
    });
  });

  describe("SET_VALID_PLACEMENTS", () => {
    it("sets valid placements", () => {
      const manager = new StateManager();
      const placements = [{ position: { x: 1, y: 2 }, rotation: 0 as const }];
      manager.dispatch({ type: "SET_VALID_PLACEMENTS", placements });
      expect(manager.getState().validPlacements).toEqual(placements);
    });
  });

  describe("SET_BOT_PLAYING", () => {
    it("sets bot playing flag", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_BOT_PLAYING", playing: true });
      expect(manager.getState().botPlaying).toBe(true);
    });
  });

  describe("SET_CONFIG", () => {
    it("partially updates game config", () => {
      const manager = new StateManager();
      manager.dispatch({ type: "SET_CONFIG", config: { mode: "MightyDuel" } });
      expect(manager.getState().gameConfig.mode).toBe("MightyDuel");
      expect(manager.getState().gameConfig.players).toEqual([]);
    });

    it("updates players in config", () => {
      const manager = new StateManager();
      const players = [{ name: "Alice", type: "human" as const }];
      manager.dispatch({ type: "SET_CONFIG", config: { players } });
      expect(manager.getState().gameConfig.players).toEqual(players);
    });
  });

  describe("subscribe", () => {
    it("notifies listeners on dispatch", () => {
      const manager = new StateManager();
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.dispatch({ type: "NAVIGATE", screen: "config" });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ screen: "config" }));
    });

    it("supports multiple listeners", () => {
      const manager = new StateManager();
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      manager.subscribe(listener1);
      manager.subscribe(listener2);

      manager.dispatch({ type: "NAVIGATE", screen: "game" });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("returns unsubscribe function", () => {
      const manager = new StateManager();
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      unsubscribe();
      manager.dispatch({ type: "NAVIGATE", screen: "config" });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});
