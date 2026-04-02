import type { RenderLine } from "@pompidup/cligrid";
import type { TranslateFn } from "../i18n/index.js";
import { THEME } from "./theme.js";

export type StatusBarPhase = "pick" | "place" | "idle";

export type StatusBarProps = {
  phase: StatusBarPhase;
  error?: { message: string } | null;
  errorFlash?: boolean;
  successFlash?: boolean;
  t?: TranslateFn;
};

export function renderStatusBar(props: StatusBarProps): RenderLine[] {
  const { phase, error, errorFlash = false, successFlash = false, t } = props;

  if (error) {
    if (successFlash) {
      return [
        {
          text: `✓ ${error.message}`,
          style: { fg: THEME.ui.success.fg, bg: THEME.ui.success.bg, bold: true },
        },
      ];
    }
    const style = errorFlash
      ? { fg: THEME.ui.error.fg, bg: THEME.ui.error.bg, bold: true }
      : { fg: THEME.ui.error.fg, bold: true };
    return [{ text: `⚠ ${error.message}`, style }];
  }

  const shortcuts: Record<StatusBarPhase, string> = {
    pick: t?.("shortcutsPick") ?? "↑↓ Navigate  ⏎ Pick  Tab View kingdoms",
    place: t?.("shortcutsPlace") ?? "←↑↓→ Move  R Rotate  ⏎ Place  D Discard  Tab View",
    idle: t?.("shortcutsIdle") ?? "⏎ Continue",
  };

  return [{ text: shortcuts[phase], style: { dim: true } }];
}
