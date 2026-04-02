import type { Style, StyledSegment, RenderLine, TextAlign } from "@pompidup/cligrid";
import type { Ground } from "@pompidup/kingdomino-engine";
import { THEME } from "./theme.js";

type TerrainType = Ground | "empty";

/** Create a styled text segment */
export function textSegment(text: string, style?: Partial<Style>): StyledSegment {
  return style ? { text, style } : { text };
}

/** Create a terrain-colored tile segment */
export function coloredTile(label: string, terrainType: TerrainType): StyledSegment {
  return {
    text: label,
    style: {
      bg: THEME.terrain.bg[terrainType],
      fg: THEME.terrain.fg[terrainType],
      bold: terrainType !== "empty",
    },
  };
}

/** Join multiple segments with an optional separator segment */
export function joinSegments(segments: StyledSegment[], separator?: string): StyledSegment[] {
  if (!separator || segments.length <= 1) return segments;
  const result: StyledSegment[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) result.push({ text: separator });
    result.push(segments[i]);
  }
  return result;
}

/** Create a RenderLine from segments with optional alignment */
export function segmentLine(segments: StyledSegment[], align?: TextAlign): RenderLine {
  const text = segments.map((s) => s.text).join("");
  const line: RenderLine = { text, segments };
  if (align) line.align = align;
  return line;
}
