import type { RenderLine } from "@pompidup/cligrid";
import {
  renderLogoLines,
  renderCentered,
  CROWN_DECORATION,
  TAGLINE,
  PROMPT_TEXT,
} from "./ascii-art.js";
import type { TranslateFn } from "../i18n/index.js";

export type TitleScreenRenderOptions = {
  width: number;
  showPrompt: boolean;
  t?: TranslateFn;
};

export function renderTitleScreen(options: TitleScreenRenderOptions): RenderLine[] {
  const { width, showPrompt, t } = options;
  const lines: RenderLine[] = [];

  lines.push({ text: "" });
  lines.push({ text: "" });

  lines.push(...renderLogoLines(width));

  lines.push({ text: "" });
  lines.push({
    text: renderCentered(CROWN_DECORATION, width),
    style: { fg: "#f5d442" },
  });
  lines.push({ text: "" });
  lines.push({
    text: renderCentered(t?.("tagline") ?? TAGLINE, width),
    style: { dim: true },
  });
  lines.push({ text: "" });
  lines.push({ text: "" });

  if (showPrompt) {
    lines.push({
      text: renderCentered(t?.("pressEnter") ?? PROMPT_TEXT, width),
      style: { bold: true },
    });
  } else {
    lines.push({ text: "" });
  }

  return lines;
}
