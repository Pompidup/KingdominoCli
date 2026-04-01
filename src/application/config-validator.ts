import type { GameConfig } from "../domain/types.js";

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validateGameConfig(config: GameConfig): ValidationResult {
  const errors: string[] = [];

  if (config.players.length < 2) {
    errors.push("At least 2 players required");
  }

  if (config.players.length > 4) {
    errors.push("Maximum 4 players allowed");
  }

  for (const player of config.players) {
    if (player.name.length < 3) {
      errors.push(`Player name "${player.name}" must be at least 3 characters`);
    }
  }

  const names = config.players.map((p) => p.name.toLowerCase());
  const uniqueNames = new Set(names);
  if (uniqueNames.size !== names.length) {
    errors.push("Player names must be unique");
  }

  for (const player of config.players) {
    if (player.type === "bot" && !player.botLevel) {
      errors.push(`Bot player "${player.name}" must have a strategy level`);
    }
  }

  return { valid: errors.length === 0, errors };
}
