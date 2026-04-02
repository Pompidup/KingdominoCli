import { describe, it, expect } from "vitest";
import { textSegment, coloredTile, joinSegments, segmentLine } from "../segment-utils.js";
import { THEME } from "../theme.js";

describe("textSegment", () => {
  it("creates a segment without style when none provided", () => {
    const seg = textSegment("hello");
    expect(seg).toEqual({ text: "hello" });
    expect(seg).not.toHaveProperty("style");
  });

  it("creates a segment with style when provided", () => {
    const seg = textSegment("hello", { bold: true, fg: "#ff0000" });
    expect(seg.text).toBe("hello");
    expect(seg.style?.bold).toBe(true);
    expect(seg.style?.fg).toBe("#ff0000");
  });
});

describe("coloredTile", () => {
  it("creates a wheat tile segment with correct colors", () => {
    const seg = coloredTile("W", "wheat");
    expect(seg.text).toBe("W");
    expect(seg.style?.bg).toBe(THEME.terrain.bg.wheat);
    expect(seg.style?.fg).toBe(THEME.terrain.fg.wheat);
    expect(seg.style?.bold).toBe(true);
  });

  it("creates an empty tile segment with bold false", () => {
    const seg = coloredTile(" ", "empty");
    expect(seg.text).toBe(" ");
    expect(seg.style?.bg).toBe(THEME.terrain.bg.empty);
    expect(seg.style?.bold).toBe(false);
  });

  it("creates a forest tile segment", () => {
    const seg = coloredTile("F", "forest");
    expect(seg.style?.bg).toBe(THEME.terrain.bg.forest);
    expect(seg.style?.fg).toBe(THEME.terrain.fg.forest);
  });
});

describe("joinSegments", () => {
  const a = textSegment("A");
  const b = textSegment("B");
  const c = textSegment("C");

  it("inserts separator between segments", () => {
    const result = joinSegments([a, b, c], " | ");
    expect(result).toHaveLength(5);
    expect(result[0].text).toBe("A");
    expect(result[1].text).toBe(" | ");
    expect(result[2].text).toBe("B");
    expect(result[3].text).toBe(" | ");
    expect(result[4].text).toBe("C");
  });

  it("returns single segment without separator", () => {
    const result = joinSegments([a], " | ");
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("A");
  });

  it("returns empty array for empty input", () => {
    expect(joinSegments([], " | ")).toHaveLength(0);
  });

  it("returns segments as-is when no separator provided", () => {
    const result = joinSegments([a, b]);
    expect(result).toHaveLength(2);
  });
});

describe("segmentLine", () => {
  it("creates a RenderLine with concatenated text and segments", () => {
    const segs = [textSegment("Hello"), textSegment(" World")];
    const line = segmentLine(segs);
    expect(line.text).toBe("Hello World");
    expect(line.segments).toEqual(segs);
    expect(line.align).toBeUndefined();
  });

  it("sets align when provided", () => {
    const segs = [textSegment("centered")];
    const line = segmentLine(segs, "center");
    expect(line.align).toBe("center");
  });

  it("sets align to right", () => {
    const line = segmentLine([textSegment("right")], "right");
    expect(line.align).toBe("right");
  });
});
