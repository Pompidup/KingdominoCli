import type { RenderLine } from "@pompidup/cligrid";
import type { TranslateFn } from "../i18n/index.js";

export type TurnInfoProps = {
  turn: number;
  playerName: string;
  playerColor?: string;
  action: string;
  score: number;
  botPlaying: boolean;
  t?: TranslateFn;
};

export function renderTurnInfo(props: TurnInfoProps): RenderLine[] {
  const { turn, playerName, playerColor, action, score, botPlaying, t } = props;

  const actionLabels: Record<string, string> = {
    pickDomino: t?.("pickDomino") ?? "Pick domino",
    placeDomino: t?.("placeDomino") ?? "Place domino",
    pass: t?.("pass") ?? "Pass",
  };

  const colorIndicator = playerColor ? "■ " : "";
  const botText = t?.("botThinking") ?? "Bot thinking...";
  const actionText = botPlaying ? `🤖 ${botText}` : (actionLabels[action] ?? action);
  const turnLabel = t?.("turn") ?? "Turn";
  const scoreLabel = t?.("score") ?? "Score";
  const text = `${turnLabel} ${turn} | ${colorIndicator}${playerName} | ${actionText} | ${scoreLabel}: ${score}`;

  const style: RenderLine["style"] = { bold: true };
  if (playerColor) {
    style.fg = playerColor;
  }

  return [{ text, style }];
}
