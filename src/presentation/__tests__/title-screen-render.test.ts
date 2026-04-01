import { describe, it, expect } from "vitest";
import { renderTitleScreen } from "../title-screen-render.js";
import { TAGLINE, PROMPT_TEXT } from "../ascii-art.js";

describe("renderTitleScreen", () => {
  const defaultOptions = { width: 100, showPrompt: true };

  it("returns multiple lines", () => {
    const lines = renderTitleScreen(defaultOptions);
    expect(lines.length).toBeGreaterThan(5);
  });

  it("contains the logo", () => {
    const lines = renderTitleScreen(defaultOptions);
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("██");
  });

  it("contains the crown decoration", () => {
    const lines = renderTitleScreen(defaultOptions);
    const allText = lines.map((l) => l.text).join("\n");
    expect(allText).toContain("♔");
  });

  it("contains the tagline", () => {
    const lines = renderTitleScreen(defaultOptions);
    const texts = lines.map((l) => l.text.trim());
    expect(texts).toContain(TAGLINE);
  });

  it("shows prompt when showPrompt is true", () => {
    const lines = renderTitleScreen({ width: 100, showPrompt: true });
    const texts = lines.map((l) => l.text.trim());
    expect(texts).toContain(PROMPT_TEXT);
  });

  it("hides prompt when showPrompt is false", () => {
    const lines = renderTitleScreen({ width: 100, showPrompt: false });
    const texts = lines.map((l) => l.text.trim());
    expect(texts).not.toContain(PROMPT_TEXT);
  });

  it("prompt line has bold style", () => {
    const lines = renderTitleScreen({ width: 100, showPrompt: true });
    const promptLine = lines.find((l) => l.text.trim() === PROMPT_TEXT);
    expect(promptLine?.style?.bold).toBe(true);
  });

  it("tagline has dim style", () => {
    const lines = renderTitleScreen(defaultOptions);
    const taglineLine = lines.find((l) => l.text.trim() === TAGLINE);
    expect(taglineLine?.style?.dim).toBe(true);
  });
});
