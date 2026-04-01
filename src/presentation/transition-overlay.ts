import type { RenderLine } from "@pompidup/cligrid";

export type TransitionOverlayProps = {
  playerName: string;
  playerColor?: string;
  width: number;
  height: number;
};

function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const pad = Math.floor((width - text.length) / 2);
  return " ".repeat(pad) + text + " ".repeat(width - text.length - pad);
}

export function renderTransitionOverlay(props: TransitionOverlayProps): RenderLine[] {
  const { playerName, playerColor, width, height } = props;
  const lines: RenderLine[] = [];

  const decorLine = `─── ♚ ${playerName} ♚ ───`;
  const centerY = Math.floor(height / 2);

  for (let i = 0; i < height; i++) {
    if (i === centerY - 1) {
      lines.push({ text: centerText(decorLine, width), style: { dim: true } });
    } else if (i === centerY) {
      lines.push({
        text: centerText(playerName, width),
        style: { bold: true, fg: playerColor },
      });
    } else if (i === centerY + 1) {
      lines.push({ text: centerText(decorLine, width), style: { dim: true } });
    } else {
      lines.push({ text: " ".repeat(width), style: { dim: true } });
    }
  }

  return lines;
}
