import { describe, it, expect } from "vitest";
import { renderStatusBar } from "../status-bar.js";

describe("renderStatusBar", () => {
  describe("pick phase", () => {
    it("shows pick shortcuts", () => {
      const [line] = renderStatusBar({ phase: "pick" });
      expect(line.text).toContain("Navigate");
      expect(line.text).toContain("Pick");
      expect(line.text).toContain("View kingdoms");
    });

    it("renders with dim style", () => {
      const [line] = renderStatusBar({ phase: "pick" });
      expect(line.style?.dim).toBe(true);
    });
  });

  describe("place phase", () => {
    it("shows place shortcuts", () => {
      const [line] = renderStatusBar({ phase: "place" });
      expect(line.text).toContain("Move");
      expect(line.text).toContain("Rotate");
      expect(line.text).toContain("Place");
      expect(line.text).toContain("Discard");
    });
  });

  describe("idle phase", () => {
    it("shows continue shortcut", () => {
      const [line] = renderStatusBar({ phase: "idle" });
      expect(line.text).toContain("Continue");
    });
  });

  describe("error display", () => {
    it("shows error message instead of shortcuts", () => {
      const [line] = renderStatusBar({ phase: "pick", error: { message: "Invalid placement!" } });
      expect(line.text).toContain("Invalid placement!");
      expect(line.text).not.toContain("Navigate");
    });

    it("renders error in red bold", () => {
      const [line] = renderStatusBar({ phase: "pick", error: { message: "Error" } });
      expect(line.style?.fg).toBe("#ff0000");
      expect(line.style?.bold).toBe(true);
    });

    it("shows shortcuts when error is null", () => {
      const [line] = renderStatusBar({ phase: "pick", error: null });
      expect(line.text).toContain("Navigate");
    });
  });
});
