import { describe, it, expect, vi } from "vitest";
import type { GameEngine, GameWithNextAction, GameState } from "@pompidup/kingdomino-engine";
import { BotAdapter } from "../bot-adapter.js";

vi.mock("@pompidup/kingdomino-engine", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@pompidup/kingdomino-engine")>();
  return {
    ...actual,
    playBotTurn: vi.fn(),
    isBotTurn: vi.fn(),
    getStrategyNames: vi.fn(),
    getStrategy: vi.fn(),
  };
});

import {
  playBotTurn as mockPlayBotTurn,
  isBotTurn as mockIsBotTurn,
  getStrategyNames as mockGetStrategyNames,
  getStrategy as mockGetStrategy,
} from "@pompidup/kingdomino-engine";

const fakeEngine = {} as GameEngine;

const fakeGame = {
  id: "game-1",
  players: [{ id: "player-1", name: "Bot", kingdom: [], bot: { strategyName: "greedy" } }],
  lords: [{ id: "lord-1", playerId: "player-1", turnEnded: false, hasPick: false, hasPlace: false }],
  nextAction: { type: "action", nextLord: "lord-1", nextAction: "pickDomino" },
} as unknown as GameWithNextAction;

const fakeResult = { id: "game-1", turn: 2 } as unknown as GameState;

describe("BotAdapter", () => {
  const adapter = new BotAdapter();

  describe("playBotTurn", () => {
    it("returns ok result on success", () => {
      const fakeStrategy = { chooseDomino: vi.fn(), choosePlacement: vi.fn() };
      vi.mocked(mockGetStrategy).mockReturnValue(fakeStrategy);
      vi.mocked(mockPlayBotTurn).mockReturnValue(fakeResult);

      const result = adapter.playBotTurn(fakeEngine, fakeGame);

      expect(result).toEqual({ ok: true, value: fakeResult });
      expect(mockGetStrategy).toHaveBeenCalledWith("greedy");
    });

    it("returns error if strategy not found", () => {
      vi.mocked(mockGetStrategy).mockReturnValue(undefined);

      const result = adapter.playBotTurn(fakeEngine, fakeGame);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("UNKNOWN_STRATEGY");
      }
    });

    it("returns error on exception", () => {
      const fakeStrategy = { chooseDomino: vi.fn(), choosePlacement: vi.fn() };
      vi.mocked(mockGetStrategy).mockReturnValue(fakeStrategy);
      vi.mocked(mockPlayBotTurn).mockImplementation(() => {
        throw new Error("bot failed");
      });

      const result = adapter.playBotTurn(fakeEngine, fakeGame);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("BOT_ERROR");
      }
    });

    it("defaults to random strategy when player has no bot config", () => {
      const humanGame = {
        ...fakeGame,
        players: [{ id: "player-1", name: "Human", kingdom: [] }],
      } as unknown as GameWithNextAction;
      const fakeStrategy = { chooseDomino: vi.fn(), choosePlacement: vi.fn() };
      vi.mocked(mockGetStrategy).mockReturnValue(fakeStrategy);
      vi.mocked(mockPlayBotTurn).mockReturnValue(fakeResult);

      adapter.playBotTurn(fakeEngine, humanGame);

      expect(mockGetStrategy).toHaveBeenCalledWith("random");
    });
  });

  describe("isBotTurn", () => {
    it("delegates to engine function", () => {
      vi.mocked(mockIsBotTurn).mockReturnValue(true);

      expect(adapter.isBotTurn(fakeGame)).toBe(true);
      expect(mockIsBotTurn).toHaveBeenCalledWith(fakeGame);
    });

    it("returns false when not bot turn", () => {
      vi.mocked(mockIsBotTurn).mockReturnValue(false);

      expect(adapter.isBotTurn(fakeGame)).toBe(false);
    });
  });

  describe("getStrategyNames", () => {
    it("delegates to engine function", () => {
      vi.mocked(mockGetStrategyNames).mockReturnValue(["random", "greedy", "advanced", "expert"]);

      expect(adapter.getStrategyNames()).toEqual(["random", "greedy", "advanced", "expert"]);
    });
  });
});
