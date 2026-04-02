import { describe, it, expect } from "vitest";
import { THEME } from "../theme.js";

const HEX_REGEX = /^#[0-9a-f]{6}$/i;

describe("THEME", () => {
  describe("royal palette", () => {
    it.each(Object.entries(THEME.royal))("%s is a valid hex color", (_name, color) => {
      expect(color).toMatch(HEX_REGEX);
    });
  });

  describe("terrain bg colors", () => {
    it.each(Object.entries(THEME.terrain.bg))("%s bg is a valid hex color", (_type, color) => {
      expect(color).toMatch(HEX_REGEX);
    });
  });

  describe("terrain fg colors", () => {
    it.each(Object.entries(THEME.terrain.fg))("%s fg is a valid hex color", (_type, color) => {
      expect(color).toMatch(HEX_REGEX);
    });
  });

  describe("terrain completeness", () => {
    it("bg and fg have the same keys", () => {
      expect(Object.keys(THEME.terrain.bg).sort()).toEqual(Object.keys(THEME.terrain.fg).sort());
    });
  });

  describe("highlight colors", () => {
    it.each(Object.entries(THEME.highlight))("%s is a valid hex color", (_name, color) => {
      expect(color).toMatch(HEX_REGEX);
    });
  });

  describe("player colors", () => {
    it("has at least 4 player colors", () => {
      expect(THEME.player.colors.length).toBeGreaterThanOrEqual(4);
    });

    it.each(THEME.player.colors.map((c, i) => [i, c]))(
      "player color %i is a valid hex color",
      (_index, color) => {
        expect(color).toMatch(HEX_REGEX);
      },
    );
  });

  describe("ui colors", () => {
    it("gold is a valid hex color", () => {
      expect(THEME.ui.gold).toMatch(HEX_REGEX);
    });

    it("gridBg is a valid hex color", () => {
      expect(THEME.ui.gridBg).toMatch(HEX_REGEX);
    });

    it("success fg/bg are valid hex colors", () => {
      expect(THEME.ui.success.fg).toMatch(HEX_REGEX);
      expect(THEME.ui.success.bg).toMatch(HEX_REGEX);
    });

    it("error fg/bg are valid hex colors", () => {
      expect(THEME.ui.error.fg).toMatch(HEX_REGEX);
      expect(THEME.ui.error.bg).toMatch(HEX_REGEX);
    });

    it("errorFlash fg/bg are valid hex colors", () => {
      expect(THEME.ui.errorFlash.fg).toMatch(HEX_REGEX);
      expect(THEME.ui.errorFlash.bg).toMatch(HEX_REGEX);
    });

    it("startButton is a valid hex color", () => {
      expect(THEME.ui.startButton).toMatch(HEX_REGEX);
    });
  });
});
