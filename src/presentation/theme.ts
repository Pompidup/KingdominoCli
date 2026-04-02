import type { Ground } from "@pompidup/kingdomino-engine";

type TerrainType = Ground | "empty";

export const THEME = {
  // Royal palette (V2 colors)
  royal: {
    violet: "#6a0dad",
    bleuNuit: "#1a1a3e",
    rougeRubis: "#c41e3a",
    emeraude: "#2ecc71",
    argent: "#c0c0c0",
    bronze: "#cd7f32",
    fondSombre: "#0d0d1a",
  },

  // Terrain colors
  terrain: {
    bg: {
      castle: "#8a6fba",
      wheat: "#f5d442",
      forest: "#228b22",
      sea: "#1e90ff",
      plain: "#90ee90",
      swamp: "#8b7355",
      mine: "#4a4a4a",
      empty: "#1a1a1a",
    } satisfies Record<TerrainType, string>,
    fg: {
      castle: "#ffffff",
      wheat: "#000000",
      forest: "#ffffff",
      sea: "#ffffff",
      plain: "#000000",
      swamp: "#ffffff",
      mine: "#ffffff",
      empty: "#333333",
    } satisfies Record<TerrainType, string>,
  },

  // Placement highlight colors
  highlight: {
    valid: "#00aa00",
    invalid: "#aa0000",
    error: "#cc0000",
  },

  // Player colors
  player: {
    colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"] as readonly string[],
  },

  // UI semantic colors
  ui: {
    gold: "#f5d442",
    gridBg: "#1a1a2e",
    success: { fg: "#00ff00", bg: "#003300" },
    error: { fg: "#ff0000", bg: "#330000" },
    errorFlash: { bg: "#660000", fg: "#ff0000" },
    startButton: "#00ff00",
  },
} as const;
