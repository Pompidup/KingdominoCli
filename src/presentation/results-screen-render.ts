import type { RenderLine } from "@pompidup/cligrid";
import type { FinalResult, Kingdom } from "@pompidup/kingdomino-engine";
import { renderCentered } from "./ascii-art.js";
import { renderKingdomGrid } from "./kingdom-grid.js";
import type { TranslateFn } from "../i18n/index.js";
import { THEME } from "./theme.js";
import { separator } from "./segment-utils.js";

export type ResultsScreenProps = {
  results: FinalResult[];
  playerKingdoms: Map<string, Kingdom>;
  width: number;
  animatedScores?: Map<string, number>;
  t?: TranslateFn;
};

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

function getGameOverArt(t?: TranslateFn): string[] {
  const text = t?.("gameOver") ?? "G A M E   O V E R";
  const padded =
    text.length < 27 ? text.padStart(Math.floor((27 + text.length) / 2)).padEnd(27) : text;
  return [
    "╔═══════════════════════════════╗",
    `║  ${padded}  ║`,
    "╚═══════════════════════════════╝",
  ];
}

function getMedal(position: number): string {
  return MEDAL_ICONS[position - 1] ?? `#${position}`;
}

function renderScoreBreakdown(
  details: {
    points: number;
    maxPropertiesSize: number;
    totalCrowns: number;
  },
  t?: TranslateFn,
): string {
  const scoreLabel = t?.("score") ?? "Score";
  const propLabel = t?.("largestProperty") ?? "Largest property";
  const crownLabel = t?.("crowns") ?? "Crowns";
  return `${scoreLabel}: ${details.points}  |  ${propLabel}: ${details.maxPropertiesSize}  |  ${crownLabel}: ${details.totalCrowns}`;
}

export function renderResultsScreen(props: ResultsScreenProps): RenderLine[] {
  const { results, playerKingdoms, width, animatedScores, t } = props;
  const lines: RenderLine[] = [];

  // Top spacing
  lines.push({ text: "" });

  // Crown decoration
  lines.push({
    text: renderCentered("♔ ♕ ♔ ♕ ♔ ♕ ♔", width),
    style: { fg: THEME.ui.gold },
  });
  lines.push({ text: "" });

  // Game Over header
  const gameOverArt = getGameOverArt(t);
  for (const artLine of gameOverArt) {
    lines.push({
      text: renderCentered(artLine, width),
      style: { fg: THEME.ui.gold, bold: true },
    });
  }

  lines.push({ text: "" });
  lines.push({
    text: renderCentered("♔ ♕ ♔ ♕ ♔ ♕ ♔", width),
    style: { fg: THEME.ui.gold },
  });
  lines.push({ text: "" });

  // Sorted results (already sorted by position from engine)
  const sorted = [...results].sort((a, b) => a.position - b.position);

  for (const result of sorted) {
    const medal = getMedal(result.position);
    const displayScore = animatedScores?.get(result.playerId) ?? result.details.points;
    const ptsLabel = t?.("pts") ?? "pts";

    // Player header line: medal + name + score
    const playerHeader = `${medal}  ${result.playerName}  —  ${displayScore} ${ptsLabel}`;
    lines.push({
      text: renderCentered(playerHeader, width),
      style: { bold: true },
    });

    // Score breakdown
    const breakdown = renderScoreBreakdown(result.details, t);
    lines.push({
      text: renderCentered(breakdown, width),
      style: { dim: true },
    });

    // Mini kingdom
    const kingdom = playerKingdoms.get(result.playerId);
    if (kingdom) {
      const miniLines = renderKingdomGrid({ kingdom, compact: true });
      for (const ml of miniLines) {
        lines.push({
          text: renderCentered(ml.text, width),
          style: ml.style,
        });
      }
    }

    lines.push({ text: "" });
  }

  // Footer
  const sep = separator(40);
  lines.push({ text: renderCentered(sep.text, width), style: sep.style });
  lines.push({ text: "" });
  const playAgainLabel = t?.("playAgain") ?? "Enter → Play Again";
  const quitLabel = t?.("quit") ?? "Q → Quit";
  lines.push({
    text: renderCentered(`${playAgainLabel}  |  ${quitLabel}`, width),
    style: { bold: true },
  });

  return lines;
}
