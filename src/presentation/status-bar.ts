import type { RenderLine } from "@pompidup/cligrid";

export type StatusBarPhase = "pick" | "place" | "idle";

export type StatusBarProps = {
  phase: StatusBarPhase;
  error?: { message: string } | null;
};

const PHASE_SHORTCUTS: Record<StatusBarPhase, string> = {
  pick: "↑↓ Navigate  ⏎ Pick  Tab View kingdoms",
  place: "←↑↓→ Move  R Rotate  ⏎ Place  D Discard  Tab View",
  idle: "⏎ Continue",
};

export function renderStatusBar(props: StatusBarProps): RenderLine[] {
  const { phase, error } = props;

  if (error) {
    return [{ text: `⚠ ${error.message}`, style: { fg: "#ff0000", bold: true } }];
  }

  return [{ text: PHASE_SHORTCUTS[phase], style: { dim: true } }];
}
