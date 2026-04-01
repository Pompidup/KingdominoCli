import { describe, it, expect, vi } from "vitest";
import { orchestrateGameSetup } from "../game-orchestrator.js";
import type { GamePort } from "../../domain/ports/game-port.js";
import type { GameConfig } from "../../domain/types.js";
import type { GameWithNextStep, GameWithNextAction } from "@pompidup/kingdomino-engine";

function createMockGamePort(): GamePort {
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
    getValidPlacements: vi.fn(),
    canPlaceDomino: vi.fn(),
    calculateScore: vi.fn(),
    getResults: vi.fn(),
  } as unknown as GamePort;
}

const fakeStep = { id: "g1", nextAction: { type: "step" } } as unknown as GameWithNextStep;
const fakeAction = {
  id: "g1",
  nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
} as unknown as GameWithNextAction;

describe("orchestrateGameSetup", () => {
  it("runs the full setup sequence and returns the started game", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addPlayers).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addExtraRules).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.startGame).mockReturnValue({ ok: true, value: fakeAction });

    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "Bobby", type: "human" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort }, config);

    expect(result).toEqual({ ok: true, value: fakeAction });
    expect(gamePort.createGame).toHaveBeenCalledWith("Classic");
    expect(gamePort.addPlayers).toHaveBeenCalledWith(fakeStep, ["Alice", "Bobby"]);
    expect(gamePort.addExtraRules).toHaveBeenCalledWith(fakeStep, []);
    expect(gamePort.startGame).toHaveBeenCalledWith(fakeStep);
  });

  it("converts bot players to PlayerInput with strategy", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addPlayers).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addExtraRules).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.startGame).mockReturnValue({ ok: true, value: fakeAction });

    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "BotBob", type: "bot", botLevel: "greedy" },
      ],
      extraRules: [],
    };

    orchestrateGameSetup({ gamePort }, config);

    expect(gamePort.addPlayers).toHaveBeenCalledWith(fakeStep, [
      "Alice",
      { name: "BotBob", bot: { strategyName: "greedy" } },
    ]);
  });

  it("passes extra rules to addExtraRules", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addPlayers).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addExtraRules).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.startGame).mockReturnValue({ ok: true, value: fakeAction });

    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "Bobby", type: "human" },
      ],
      extraRules: ["Harmony", "MiddleKingdom"],
    };

    orchestrateGameSetup({ gamePort }, config);

    expect(gamePort.addExtraRules).toHaveBeenCalledWith(fakeStep, ["Harmony", "MiddleKingdom"]);
  });

  it("returns error if createGame fails", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({
      ok: false,
      error: { code: "MODE_NOT_FOUND", message: "Mode not found" },
    });

    const config: GameConfig = {
      mode: "Invalid",
      players: [{ name: "Alice", type: "human" }],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort }, config);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("MODE_NOT_FOUND");
    }
    expect(gamePort.addPlayers).not.toHaveBeenCalled();
  });

  it("returns error if addPlayers fails", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addPlayers).mockReturnValue({
      ok: false,
      error: { code: "INVALID_PLAYER_COUNT", message: "Too few players" },
    });

    const config: GameConfig = {
      mode: "Classic",
      players: [{ name: "Al", type: "human" }],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort }, config);

    expect(result.ok).toBe(false);
    expect(gamePort.addExtraRules).not.toHaveBeenCalled();
  });

  it("returns error if addExtraRules fails", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addPlayers).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addExtraRules).mockReturnValue({
      ok: false,
      error: { code: "INVALID_RULE", message: "Unknown rule" },
    });

    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "Bobby", type: "human" },
      ],
      extraRules: ["InvalidRule"],
    };

    const result = orchestrateGameSetup({ gamePort }, config);

    expect(result.ok).toBe(false);
    expect(gamePort.startGame).not.toHaveBeenCalled();
  });

  it("returns error if startGame fails", () => {
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.createGame).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addPlayers).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.addExtraRules).mockReturnValue({ ok: true, value: fakeStep });
    vi.mocked(gamePort.startGame).mockReturnValue({
      ok: false,
      error: { code: "START_FAILED", message: "Cannot start" },
    });

    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "Bobby", type: "human" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort }, config);

    expect(result.ok).toBe(false);
  });
});
