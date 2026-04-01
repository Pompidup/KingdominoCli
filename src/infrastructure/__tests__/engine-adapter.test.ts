import { describe, it, expect, vi, beforeEach } from "vitest";
import type { GameEngine, GameState, GameWithNextStep, GameWithNextAction } from "@pompidup/kingdomino-engine";
import { EngineAdapter } from "../engine-adapter.js";

function createMockEngine(): GameEngine {
  return {
    getModes: vi.fn(),
    getExtraRules: vi.fn(),
    createGame: vi.fn(),
    addPlayers: vi.fn(),
    addExtraRules: vi.fn(),
    startGame: vi.fn(),
    chooseDomino: vi.fn(),
    placeDomino: vi.fn(),
    discardDomino: vi.fn(),
    getResults: vi.fn(),
    calculateScore: vi.fn(),
    getValidPlacements: vi.fn(),
    canPlaceDomino: vi.fn(),
    serialize: vi.fn(),
    deserialize: vi.fn(),
    getDynastyResults: vi.fn(),
  };
}

const fakeGame = { id: "game-1" } as unknown as GameState;
const fakeGameStep = { id: "game-1", nextAction: { type: "step", step: "addPlayers" } } as unknown as GameWithNextStep;
const fakeGameAction = { id: "game-1", nextAction: { type: "action", nextLord: "lord-1", nextAction: "pickDomino" } } as unknown as GameWithNextAction;

describe("EngineAdapter", () => {
  let engine: GameEngine;
  let adapter: EngineAdapter;

  beforeEach(() => {
    engine = createMockEngine();
    adapter = new EngineAdapter(engine);
  });

  describe("getModes", () => {
    it("delegates to engine and returns modes", () => {
      const modes = [{ name: "Classic", description: "Classic mode" }];
      vi.mocked(engine.getModes).mockReturnValue(modes);

      expect(adapter.getModes()).toEqual(modes);
      expect(engine.getModes).toHaveBeenCalledWith({});
    });
  });

  describe("getExtraRules", () => {
    it("delegates to engine with correct params", () => {
      const rules = [{ name: "Harmony", description: "Fill kingdom", mode: [], playersLimit: 4 }];
      vi.mocked(engine.getExtraRules).mockReturnValue(rules);

      expect(adapter.getExtraRules("Classic", 2)).toEqual(rules);
      expect(engine.getExtraRules).toHaveBeenCalledWith({ mode: "Classic", players: 2 });
    });
  });

  describe("createGame", () => {
    it("returns ok result on success", () => {
      vi.mocked(engine.createGame).mockReturnValue(fakeGameStep);

      const result = adapter.createGame("Classic");

      expect(result).toEqual({ ok: true, value: fakeGameStep });
    });

    it("returns error result on DomainException", () => {
      const error = Object.assign(new Error("Mode not found"), { code: "MODE_NOT_FOUND" });
      vi.mocked(engine.createGame).mockImplementation(() => { throw error; });

      const result = adapter.createGame("Invalid");

      expect(result).toEqual({
        ok: false,
        error: { code: "MODE_NOT_FOUND", message: "Mode not found" },
      });
    });

    it("returns UNKNOWN_ERROR for non-domain errors", () => {
      vi.mocked(engine.createGame).mockImplementation(() => { throw new Error("unexpected"); });

      const result = adapter.createGame("Classic");

      expect(result).toEqual({
        ok: false,
        error: { code: "UNKNOWN_ERROR", message: "unexpected" },
      });
    });
  });

  describe("addPlayers", () => {
    it("returns ok result on success", () => {
      vi.mocked(engine.addPlayers).mockReturnValue(fakeGameStep);

      const result = adapter.addPlayers(fakeGame, ["Alice", "Bobby"]);

      expect(result).toEqual({ ok: true, value: fakeGameStep });
      expect(engine.addPlayers).toHaveBeenCalledWith({ game: fakeGame, players: ["Alice", "Bobby"] });
    });

    it("returns error on failure", () => {
      const error = Object.assign(new Error("Too few players"), { code: "INVALID_PLAYER_COUNT" });
      vi.mocked(engine.addPlayers).mockImplementation(() => { throw error; });

      const result = adapter.addPlayers(fakeGame, ["Al"]);

      expect(result.ok).toBe(false);
    });
  });

  describe("startGame", () => {
    it("returns ok result on success", () => {
      vi.mocked(engine.startGame).mockReturnValue(fakeGameAction);

      const result = adapter.startGame(fakeGame);

      expect(result).toEqual({ ok: true, value: fakeGameAction });
    });
  });

  describe("chooseDomino", () => {
    it("returns ok result on success", () => {
      vi.mocked(engine.chooseDomino).mockReturnValue(fakeGameAction);

      const result = adapter.chooseDomino(fakeGame, 5, "lord-1");

      expect(result).toEqual({ ok: true, value: fakeGameAction });
      expect(engine.chooseDomino).toHaveBeenCalledWith({
        game: fakeGame,
        dominoPick: 5,
        lordId: "lord-1",
      });
    });
  });

  describe("placeDomino", () => {
    it("returns ok result on success", () => {
      vi.mocked(engine.placeDomino).mockReturnValue(fakeGame);

      const result = adapter.placeDomino(fakeGame, "lord-1", { x: 3, y: 4 }, 90);

      expect(result).toEqual({ ok: true, value: fakeGame });
      expect(engine.placeDomino).toHaveBeenCalledWith({
        game: fakeGame,
        lordId: "lord-1",
        position: { x: 3, y: 4 },
        rotation: 90,
      });
    });
  });

  describe("discardDomino", () => {
    it("returns ok result on success", () => {
      vi.mocked(engine.discardDomino).mockReturnValue(fakeGame);

      const result = adapter.discardDomino(fakeGame, "lord-1");

      expect(result).toEqual({ ok: true, value: fakeGame });
    });
  });

  describe("getValidPlacements", () => {
    it("delegates to engine", () => {
      const placements = [{ position: { x: 3, y: 4 }, rotation: 0 as const }];
      vi.mocked(engine.getValidPlacements).mockReturnValue(placements);

      const kingdom = [] as unknown as Parameters<typeof adapter.getValidPlacements>[0];
      const domino = { left: { type: "wheat", crowns: 0 }, right: { type: "forest", crowns: 1 }, number: 1 } as const;

      expect(adapter.getValidPlacements(kingdom, domino)).toEqual(placements);
    });
  });

  describe("canPlaceDomino", () => {
    it("delegates to engine", () => {
      vi.mocked(engine.canPlaceDomino).mockReturnValue(true);

      const kingdom = [] as unknown as Parameters<typeof adapter.canPlaceDomino>[0];
      const domino = { left: { type: "wheat", crowns: 0 }, right: { type: "forest", crowns: 1 }, number: 1 } as const;

      expect(adapter.canPlaceDomino(kingdom, domino)).toBe(true);
    });
  });

  describe("calculateScore", () => {
    it("delegates to engine", () => {
      const score = { points: 10, maxPropertiesSize: 3, totalCrowns: 2 };
      vi.mocked(engine.calculateScore).mockReturnValue(score);

      const kingdom = [] as unknown as Parameters<typeof adapter.calculateScore>[0];

      expect(adapter.calculateScore(kingdom)).toEqual(score);
    });
  });

  describe("getResults", () => {
    it("returns ok result on success", () => {
      const results = { ...fakeGame, result: [] } as unknown as ReturnType<GameEngine["getResults"]>;
      vi.mocked(engine.getResults).mockReturnValue(results);

      const result = adapter.getResults(fakeGame);

      expect(result).toEqual({ ok: true, value: results });
    });
  });
});
