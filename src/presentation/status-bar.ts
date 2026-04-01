import type { RenderLine } from "@pompidup/cligrid";

export type StatusBarPhase = "pick" | "place" | "idle";

export type StatusBarProps = {
  phase: StatusBarPhase;
  error?: { message: string } | null;
  errorFlash?: boolean;
  successFlash?: boolean;
};

const PHASE_SHORTCUTS: Record<StatusBarPhase, string> = {
  pick: "↑↓ Navigate  ⏎ Pick  Tab View kingdoms",
  place: "←↑↓→ Move  R Rotate  ⏎ Place  D Discard  Tab View",
  idle: "⏎ Continue",
};

export function renderStatusBar(props: StatusBarProps): RenderLine[] {
  const { phase, error, errorFlash = false, successFlash = false } = props;

  if (error) {
    if (successFlash) {
      return [{ text: `✓ ${error.message}`, style: { fg: "#00ff00", bg: "#003300", bold: true } }];
    }
    const style = errorFlash
      ? { fg: "#ff0000", bg: "#330000", bold: true }
      : { fg: "#ff0000", bold: true };
    return [{ text: `⚠ ${error.message}`, style }];
  }

  return [{ text: PHASE_SHORTCUTS[phase], style: { dim: true } }];
}
