import { describe, it, expect } from "vitest";
import { createGameEngine, isGameWithNextAction } from "@pompidup/kingdomino-engine";
import { EngineAdapter } from "../engine-adapter.js";
import { BotAdapter } from "../bot-adapter.js";

describe("Engine Integration", () => {
  const engine = createGameEngine({});
  const adapter = new EngineAdapter(engine);
  const botAdapter = new BotAdapter();

  describe("getModes", () => {
    it("returns at least one mode", () => {
      const modes = adapter.getModes();
      expect(modes.length).toBeGreaterThan(0);
      expect(modes[0]).toHaveProperty("name");
      expect(modes[0]).toHaveProperty("description");
    });
  });

  describe("getExtraRules", () => {
    it("returns extra rules for Classic mode with 2 players", () => {
      const rules = adapter.getExtraRules("Classic", 2);
      expect(Array.isArray(rules)).toBe(true);
      for (const rule of rules) {
        expect(rule).toHaveProperty("name");
        expect(rule).toHaveProperty("description");
      }
    });
  });

  describe("full game setup flow", () => {
    it("createGame → addPlayers → startGame succeeds", () => {
      const createResult = adapter.createGame("Classic");
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const addResult = adapter.addPlayers(createResult.value, ["Alice", "Bobby"]);
      expect(addResult.ok).toBe(true);
      if (!addResult.ok) return;

      expect(addResult.value.players).toHaveLength(2);
      expect(addResult.value.players[0].name).toBe("Alice");
      expect(addResult.value.players[1].name).toBe("Bobby");

      const startResult = adapter.startGame(addResult.value);
      expect(startResult.ok).toBe(true);
      if (!startResult.ok) return;

      expect(startResult.value.turn).toBeGreaterThanOrEqual(0);
      expect(startResult.value.currentDominoes.length).toBeGreaterThan(0);
      expect(isGameWithNextAction(startResult.value)).toBe(true);
      expect(startResult.value.nextAction.type).toBe("action");
    });
  });

  describe("error handling", () => {
    it("returns error for invalid player names", () => {
      const createResult = adapter.createGame("Classic");
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const addResult = adapter.addPlayers(createResult.value, ["Al", "Bo"]);
      expect(addResult.ok).toBe(false);
      if (addResult.ok) return;

      expect(addResult.error.code).toBeDefined();
    });
  });

  describe("bot integration", () => {
    it("getStrategyNames returns built-in strategies", () => {
      const names = botAdapter.getStrategyNames();
      expect(names).toContain("random");
      expect(names).toContain("greedy");
    });

    it("isBotTurn returns false for human players", () => {
      const createResult = adapter.createGame("Classic");
      if (!createResult.ok) return;
      const addResult = adapter.addPlayers(createResult.value, ["Alice", "Bobby"]);
      if (!addResult.ok) return;
      const startResult = adapter.startGame(addResult.value);
      if (!startResult.ok) return;

      expect(botAdapter.isBotTurn(startResult.value)).toBe(false);
    });

    it("isBotTurn returns true for bot players", () => {
      const createResult = adapter.createGame("Classic");
      if (!createResult.ok) return;
      const addResult = adapter.addPlayers(createResult.value, [
        { name: "BotOne", bot: { strategyName: "random" } },
        { name: "BotTwo", bot: { strategyName: "random" } },
      ]);
      if (!addResult.ok) return;
      const startResult = adapter.startGame(addResult.value);
      if (!startResult.ok) return;

      expect(botAdapter.isBotTurn(startResult.value)).toBe(true);
    });
  });
});
