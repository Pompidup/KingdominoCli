import { describe, it, expect } from "vitest";
import {
  KINGDOMINO_LOGO,
  CROWN_DECORATION,
  TAGLINE,
  PROMPT_TEXT,
  renderCentered,
  renderLogoLines,
} from "../ascii-art.js";

describe("KINGDOMINO_LOGO", () => {
  it("has multiple lines", () => {
    expect(KINGDOMINO_LOGO.length).toBeGreaterThan(3);
  });

  it("contains KINGDOMINO characters", () => {
    const joined = KINGDOMINO_LOGO.join("");
    expect(joined).toContain("██");
  });
});

describe("constants", () => {
  it("CROWN_DECORATION is defined", () => {
    expect(CROWN_DECORATION.length).toBeGreaterThan(0);
  });

  it("TAGLINE is defined", () => {
    expect(TAGLINE).toBe("Build your kingdom, one domino at a time");
  });

  it("PROMPT_TEXT is defined", () => {
    expect(PROMPT_TEXT).toBe("Press ENTER to start");
  });
});

describe("renderCentered", () => {
  it("centers text in given width", () => {
    const result = renderCentered("hello", 20);
    expect(result).toBe("       hello");
    expect(result.length).toBeLessThanOrEqual(20);
  });

  it("returns text as-is if wider than width", () => {
    const result = renderCentered("hello world", 5);
    expect(result).toBe("hello world");
  });

  it("handles exact width", () => {
    const result = renderCentered("hi", 2);
    expect(result).toBe("hi");
  });

  it("handles empty string", () => {
    const result = renderCentered("", 10);
    expect(result).toBe("     ");
  });
});

describe("renderLogoLines", () => {
  it("returns one RenderLine per logo line", () => {
    const lines = renderLogoLines(120);
    expect(lines).toHaveLength(KINGDOMINO_LOGO.length);
  });

  it("applies gold color and bold style", () => {
    const lines = renderLogoLines(120);
    for (const line of lines) {
      expect(line.style?.fg).toBe("#f5d442");
      expect(line.style?.bold).toBe(true);
    }
  });

  it("centers logo lines", () => {
    const lines = renderLogoLines(120);
    for (const line of lines) {
      expect(line.text.startsWith(" ")).toBe(true);
    }
  });
});
