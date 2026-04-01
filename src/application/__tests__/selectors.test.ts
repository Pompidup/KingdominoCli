import { describe, it, expect, vi } from "vitest";
import {
  getActiveLord,
  getActivePlayer,
  getCurrentDomino,
  getCurrentAction,
  getDraftDominoes,
  getKingdomForDisplay,
  getScores,
} from "../selectors.js";
import { INITIAL_APP_STATE } from "../../domain/types.js";
import type { AppState } from "../../domain/types.js";
import type {
  GameWithNextAction,
  Player,
  Lord,
  Kingdom,
  RevealsDomino,
} from "@pompidup/kingdomino-engine";

const fakeLord: Lord = {
  id: "lord-1",
  playerId: "player-1",
  turnEnded: false,
  hasPick: false,
  hasPlace: false,
  dominoPicked: {
    left: { type: "wheat", crowns: 0 },
    right: { type: "forest", crowns: 1 },
    number: 5,
  },
};

const fakeKingdom = [[{ type: "castle", crowns: 0 }]] as unknown as Kingdom;

const fakePlayer: Player = {
  id: "player-1",
  name: "Alice",
  kingdom: fakeKingdom,
};

const fakeDraft: RevealsDomino[] = [
  {
    domino: { left: { type: "wheat", crowns: 0 }, right: { type: "sea", crowns: 1 }, number: 1 },
    picked: false,
    lordId: null,
    position: 0,
  },
];

const fakeGameState: GameWithNextAction = {
  id: "game-1",
  dominoes: [],
  currentDominoes: fakeDraft,
  players: [fakePlayer],
  lords: [fakeLord],
  turn: 1,
  nextAction: { type: "action", nextLord: "lord-1", nextAction: "pickDomino" },
  rules: {
    basic: { lords: 2, maxDominoes: 24, dominoesPerTurn: 4, maxTurns: 6, maxKingdomSize: 5 },
    extra: [],
  },
  mode: { name: "Classic", description: "Classic mode" },
};

function stateWith(gameState: GameWithNextAction | null): AppState {
  return { ...INITIAL_APP_STATE, gameState };
}

describe("selectors", () => {
  describe("getActiveLord", () => {
    it("returns null when no game state", () => {
      expect(getActiveLord(INITIAL_APP_STATE)).toBeNull();
    });

    it("returns the active lord", () => {
      expect(getActiveLord(stateWith(fakeGameState))).toEqual(fakeLord);
    });

    it("returns null when lord not found", () => {
      const game = { ...fakeGameState, lords: [] };
      expect(getActiveLord(stateWith(game as GameWithNextAction))).toBeNull();
    });
  });

  describe("getActivePlayer", () => {
    it("returns null when no game state", () => {
      expect(getActivePlayer(INITIAL_APP_STATE)).toBeNull();
    });

    it("returns the player owning the active lord", () => {
      expect(getActivePlayer(stateWith(fakeGameState))).toEqual(fakePlayer);
    });
  });

  describe("getCurrentDomino", () => {
    it("returns null when no game state", () => {
      expect(getCurrentDomino(INITIAL_APP_STATE)).toBeNull();
    });

    it("returns the domino picked by active lord", () => {
      const domino = getCurrentDomino(stateWith(fakeGameState));
      expect(domino).toBeDefined();
      expect(domino?.number).toBe(5);
    });

    it("returns null when lord has no domino picked", () => {
      const lord = { ...fakeLord, dominoPicked: undefined };
      const game = { ...fakeGameState, lords: [lord] };
      expect(getCurrentDomino(stateWith(game as GameWithNextAction))).toBeNull();
    });
  });

  describe("getCurrentAction", () => {
    it("returns null when no game state", () => {
      expect(getCurrentAction(INITIAL_APP_STATE)).toBeNull();
    });

    it("returns the current action", () => {
      expect(getCurrentAction(stateWith(fakeGameState))).toBe("pickDomino");
    });
  });

  describe("getDraftDominoes", () => {
    it("returns empty array when no game state", () => {
      expect(getDraftDominoes(INITIAL_APP_STATE)).toEqual([]);
    });

    it("returns current dominoes from game state", () => {
      expect(getDraftDominoes(stateWith(fakeGameState))).toEqual(fakeDraft);
    });
  });

  describe("getKingdomForDisplay", () => {
    it("returns null when no game state", () => {
      expect(getKingdomForDisplay(INITIAL_APP_STATE)).toBeNull();
    });

    it("returns active player kingdom", () => {
      expect(getKingdomForDisplay(stateWith(fakeGameState))).toBe(fakeKingdom);
    });
  });

  describe("getScores", () => {
    it("returns empty array when no game state", () => {
      expect(getScores(INITIAL_APP_STATE, vi.fn())).toEqual([]);
    });

    it("calculates scores for all players", () => {
      const calcScore = vi
        .fn()
        .mockReturnValue({ points: 10, maxPropertiesSize: 3, totalCrowns: 2 });

      const scores = getScores(stateWith(fakeGameState), calcScore);

      expect(scores).toHaveLength(1);
      expect(scores[0]).toEqual({
        playerId: "player-1",
        playerName: "Alice",
        score: { points: 10, maxPropertiesSize: 3, totalCrowns: 2 },
      });
      expect(calcScore).toHaveBeenCalledWith(fakeKingdom);
    });
  });
});
