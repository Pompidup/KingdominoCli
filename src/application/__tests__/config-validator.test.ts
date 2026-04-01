import { describe, it, expect } from "vitest";
import { validateGameConfig } from "../config-validator.js";
import type { GameConfig, PlayerConfig } from "../../domain/types.js";

function makeConfig(players: PlayerConfig[], extraRules: string[] = []): GameConfig {
  return { mode: "Classic", players, extraRules };
}

const validPlayers: PlayerConfig[] = [
  { name: "Alice", type: "human" },
  { name: "Bobby", type: "human" },
];

describe("validateGameConfig", () => {
  it("accepts valid config with 2 human players", () => {
    const result = validateGameConfig(makeConfig(validPlayers));
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts valid config with 4 players", () => {
    const players: PlayerConfig[] = [
      { name: "Alice", type: "human" },
      { name: "Bobby", type: "human" },
      { name: "Charlie", type: "human" },
      { name: "Diana", type: "bot", botLevel: "random" },
    ];
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(true);
  });

  it("rejects fewer than 2 players", () => {
    const result = validateGameConfig(makeConfig([{ name: "Alice", type: "human" }]));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("At least 2 players required");
  });

  it("rejects more than 4 players", () => {
    const players: PlayerConfig[] = Array.from({ length: 5 }, (_, i) => ({
      name: `Player${i + 1}`,
      type: "human" as const,
    }));
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Maximum 4 players allowed");
  });

  it("rejects player names shorter than 3 characters", () => {
    const players: PlayerConfig[] = [
      { name: "Al", type: "human" },
      { name: "Bobby", type: "human" },
    ];
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('"Al"');
    expect(result.errors[0]).toContain("at least 3 characters");
  });

  it("rejects duplicate player names (case insensitive)", () => {
    const players: PlayerConfig[] = [
      { name: "Alice", type: "human" },
      { name: "alice", type: "human" },
    ];
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Player names must be unique");
  });

  it("rejects bot without strategy level", () => {
    const players: PlayerConfig[] = [
      { name: "Alice", type: "human" },
      { name: "BotPlayer", type: "bot" },
    ];
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("strategy level");
  });

  it("accepts bot with strategy level", () => {
    const players: PlayerConfig[] = [
      { name: "Alice", type: "human" },
      { name: "BotPlayer", type: "bot", botLevel: "greedy" },
    ];
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(true);
  });

  it("returns multiple errors at once", () => {
    const players: PlayerConfig[] = [{ name: "Al", type: "bot" }];
    const result = validateGameConfig(makeConfig(players));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});
