import type { RenderLine } from "@pompidup/cligrid";
import type { TranslateFn } from "../i18n/index.js";

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
      return [{ text: `✓ ${error.message}`, style: { fg: "#00ff00", bg: "#003300", bold: true } }];
    }
    const style = errorFlash
      ? { fg: "#ff0000", bg: "#330000", bold: true }
      : { fg: "#ff0000", bold: true };
    return [{ text: `⚠ ${error.message}`, style }];
  }

  const shortcuts: Record<StatusBarPhase, string> = {
    pick: t?.("shortcutsPick") ?? "↑↓ Navigate  ⏎ Pick  Tab View kingdoms",
    place: t?.("shortcutsPlace") ?? "←↑↓→ Move  R Rotate  ⏎ Place  D Discard  Tab View",
    idle: t?.("shortcutsIdle") ?? "⏎ Continue",
  };

  return [{ text: shortcuts[phase], style: { dim: true } }];
}
