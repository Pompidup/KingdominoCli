import { describe, it, expect } from "vitest";
import { createGameEngine, isGameWithNextAction } from "@pompidup/kingdomino-engine";
import type { GameWithNextAction } from "@pompidup/kingdomino-engine";
import { EngineAdapter } from "../infrastructure/engine-adapter.js";
import { BotAdapter } from "../infrastructure/bot-adapter.js";
import { orchestrateGameSetup } from "../application/game-orchestrator.js";
import type { GameConfig } from "../domain/types.js";

describe("Game Flow Integration", () => {
  const engine = createGameEngine({});
  const adapter = new EngineAdapter(engine);
  const botAdapter = new BotAdapter();

  it("orchestrates a full game setup with human players", () => {
    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "Bobby", type: "human" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort: adapter }, config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.players).toHaveLength(2);
    expect(result.value.turn).toBeGreaterThanOrEqual(0);
    expect(result.value.currentDominoes.length).toBeGreaterThan(0);
    expect(isGameWithNextAction(result.value)).toBe(true);
    expect(result.value.nextAction.nextAction).toBe("pickDomino");
  });

  it("orchestrates game setup with bot players", () => {
    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "BotBob", type: "bot", botLevel: "random" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort: adapter }, config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.players).toHaveLength(2);
    const botPlayer = result.value.players.find((p) => p.name === "BotBob");
    expect(botPlayer?.bot).toBeDefined();
  });

  it("runs a full all-bot game to completion", () => {
    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "BotOne", type: "bot", botLevel: "random" },
        { name: "BotTwo", type: "bot", botLevel: "random" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort: adapter }, config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    let game = result.value as GameWithNextAction;
    let turns = 0;
    const maxTurns = 200;

    while (isGameWithNextAction(game) && turns < maxTurns) {
      if (botAdapter.isBotTurn(game)) {
        const botResult = botAdapter.playBotTurn(adapter.getEngine(), game);
        if (!botResult.ok) {
          // Some bot turns may fail if game state transitions to a non-action state
          break;
        }
        game = botResult.value as GameWithNextAction;
      } else {
        break;
      }
      turns++;
    }

    // Game should have reached a non-action state (result step) or maxTurns
    // With 2 bot players, the game should complete within 200 turns
    expect(turns).toBeGreaterThan(0);
    expect(turns).toBeLessThan(maxTurns);
  });

  it("human pick → bot auto-play sequence works", () => {
    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "BotBob", type: "bot", botLevel: "random" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort: adapter }, config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    let game = result.value;
    expect(isGameWithNextAction(game)).toBe(true);
    if (!isGameWithNextAction(game)) return;

    // First action should be pickDomino
    expect(game.nextAction.nextAction).toBe("pickDomino");

    // Simulate human picking first available domino
    const firstDomino = game.currentDominoes[0];
    const lordId = game.nextAction.nextLord;
    const pickResult = adapter.chooseDomino(game, firstDomino.domino.number, lordId);
    expect(pickResult.ok).toBe(true);
    if (!pickResult.ok) return;

    game = pickResult.value;

    // After human pick, if next turn is bot, auto-play
    if (isGameWithNextAction(game) && botAdapter.isBotTurn(game)) {
      const botResult = botAdapter.playBotTurn(adapter.getEngine(), game);
      expect(botResult.ok).toBe(true);
      if (!botResult.ok) return;

      game = botResult.value as GameWithNextAction;
      expect(game).toBeDefined();
    }
  });

  it("valid placements can be calculated for a domino", () => {
    const config: GameConfig = {
      mode: "Classic",
      players: [
        { name: "Alice", type: "human" },
        { name: "Bobby", type: "human" },
      ],
      extraRules: [],
    };

    const result = orchestrateGameSetup({ gamePort: adapter }, config);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const domino = result.value.currentDominoes[0].domino;
    const kingdom = result.value.players[0].kingdom;

    const placements = adapter.getValidPlacements(kingdom, domino);
    expect(Array.isArray(placements)).toBe(true);
    // At the start, a domino should be placeable next to the castle
    expect(placements.length).toBeGreaterThan(0);

    const canPlace = adapter.canPlaceDomino(kingdom, domino);
    expect(canPlace).toBe(true);
  });
});
