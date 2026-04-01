import type { RenderLine } from "@pompidup/cligrid";

export type TurnInfoProps = {
  turn: number;
  playerName: string;
  playerColor?: string;
  action: string;
  score: number;
  botPlaying: boolean;
};

const ACTION_LABELS: Record<string, string> = {
  pickDomino: "Pick domino",
  placeDomino: "Place domino",
  pass: "Pass",
};

export function renderTurnInfo(props: TurnInfoProps): RenderLine[] {
  const { turn, playerName, playerColor, action, score, botPlaying } = props;

  const colorIndicator = playerColor ? "■ " : "";
  const actionText = botPlaying ? "🤖 Bot thinking..." : (ACTION_LABELS[action] ?? action);
  const text = `Turn ${turn} | ${colorIndicator}${playerName} | ${actionText} | Score: ${score}`;

  const style: RenderLine["style"] = { bold: true };
  if (playerColor) {
    style.fg = playerColor;
  }

  return [{ text, style }];
}
