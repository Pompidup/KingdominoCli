import { describe, it, expect } from "vitest";
import { renderConfigScreen } from "../config-screen-render.js";
import type { ConfigScreenRenderProps } from "../config-screen-render.js";
import type { ExtraRule } from "@pompidup/kingdomino-engine";

const baseProps: ConfigScreenRenderProps = {
  playerCount: 2,
  players: [
    { name: "Alice", type: "human" },
    { name: "Bobby", type: "human" },
  ],
  extraRules: [],
  availableRules: [],
  availableStrategies: ["random", "greedy", "advanced", "expert"],
  selectedField: "playerCount",
  errors: [],
};

describe("renderConfigScreen", () => {
  it("renders the title", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text);
    expect(texts.some((t) => t.includes("GAME CONFIGURATION"))).toBe(true);
  });

  it("renders player count selector", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("Players:");
    expect(texts).toContain("[2]");
  });

  it("highlights selected player count", () => {
    const lines = renderConfigScreen({ ...baseProps, playerCount: 3 });
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("[3]");
  });

  it("renders player names", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("Alice");
    expect(texts).toContain("Bobby");
  });

  it("renders player type toggle", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("[Human]");
  });

  it("renders bot level when player is bot", () => {
    const props = {
      ...baseProps,
      players: [
        { name: "Alice", type: "human" as const },
        { name: "BotBoy", type: "bot" as const, botLevel: "greedy" },
      ],
    };
    const lines = renderConfigScreen(props);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("[greedy]");
    expect(texts).toContain("Level:");
  });

  it("does not render bot level for human players", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).not.toContain("Level:");
  });

  it("renders extra rules when available", () => {
    const rules: ExtraRule[] = [
      {
        name: "Harmony",
        description: "Fill your kingdom",
        mode: [{ name: "Classic", description: "" }],
      },
    ];
    const lines = renderConfigScreen({ ...baseProps, availableRules: rules });
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("Harmony");
    expect(texts).toContain("☐");
  });

  it("renders checked extra rules", () => {
    const rules: ExtraRule[] = [
      {
        name: "Harmony",
        description: "Fill your kingdom",
        mode: [{ name: "Classic", description: "" }],
      },
    ];
    const lines = renderConfigScreen({
      ...baseProps,
      availableRules: rules,
      extraRules: ["Harmony"],
    });
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("☑");
  });

  it("renders start button", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("Start Game");
  });

  it("renders errors in red", () => {
    const lines = renderConfigScreen({
      ...baseProps,
      errors: ["Name too short"],
    });
    const errorLine = lines.find((l) => l.text.includes("Name too short"));
    expect(errorLine).toBeDefined();
    expect(errorLine?.style?.fg).toBe("#ff0000");
  });

  it("shows > indicator for selected field", () => {
    const lines = renderConfigScreen({ ...baseProps, selectedField: "start" });
    const startLine = lines.find((l) => l.text.includes("Start Game"));
    expect(startLine?.text.startsWith(">")).toBe(true);
  });

  it("renders help text", () => {
    const lines = renderConfigScreen(baseProps);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("Tab: next field");
  });

  it("renders empty name placeholder", () => {
    const props = {
      ...baseProps,
      players: [
        { name: "", type: "human" as const },
        { name: "Bobby", type: "human" as const },
      ],
    };
    const lines = renderConfigScreen(props);
    const texts = lines.map((l) => l.text).join("\n");
    expect(texts).toContain("___");
  });
});
