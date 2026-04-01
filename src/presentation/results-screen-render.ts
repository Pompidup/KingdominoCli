import type { RenderLine } from "@pompidup/cligrid";
import type { FinalResult, Kingdom } from "@pompidup/kingdomino-engine";
import { renderCentered } from "./ascii-art.js";
import { renderKingdomGrid } from "./kingdom-grid.js";

export type ResultsScreenProps = {
  results: FinalResult[];
  playerKingdoms: Map<string, Kingdom>;
  width: number;
  animatedScores?: Map<string, number>;
};

const MEDAL_ICONS = ["🥇", "🥈", "🥉"];

const GAME_OVER_ART = [
  "╔═══════════════════════════════╗",
  "║        G A M E   O V E R     ║",
  "╚═══════════════════════════════╝",
];

function getMedal(position: number): string {
  return MEDAL_ICONS[position - 1] ?? `#${position}`;
}

function renderScoreBreakdown(details: {
  points: number;
  maxPropertiesSize: number;
  totalCrowns: number;
}): string {
  return `Score: ${details.points}  |  Largest property: ${details.maxPropertiesSize}  |  Crowns: ${details.totalCrowns}`;
}

export function renderResultsScreen(props: ResultsScreenProps): RenderLine[] {
  const { results, playerKingdoms, width, animatedScores } = props;
  const lines: RenderLine[] = [];

  // Top spacing
  lines.push({ text: "" });

  // Crown decoration
  lines.push({
    text: renderCentered("♔ ♕ ♔ ♕ ♔ ♕ ♔", width),
    style: { fg: "#f5d442" },
  });
  lines.push({ text: "" });

  // Game Over header
  for (const artLine of GAME_OVER_ART) {
    lines.push({
      text: renderCentered(artLine, width),
      style: { fg: "#f5d442", bold: true },
    });
  }

  lines.push({ text: "" });
  lines.push({
    text: renderCentered("♔ ♕ ♔ ♕ ♔ ♕ ♔", width),
    style: { fg: "#f5d442" },
  });
  lines.push({ text: "" });

  // Sorted results (already sorted by position from engine)
  const sorted = [...results].sort((a, b) => a.position - b.position);

  for (const result of sorted) {
    const medal = getMedal(result.position);
    const displayScore = animatedScores?.get(result.playerId) ?? result.details.points;

    // Player header line: medal + name + score
    const playerHeader = `${medal}  ${result.playerName}  —  ${displayScore} pts`;
    lines.push({
      text: renderCentered(playerHeader, width),
      style: { bold: true },
    });

    // Score breakdown
    const breakdown = renderScoreBreakdown(result.details);
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
  lines.push({ text: renderCentered("─".repeat(40), width), style: { dim: true } });
  lines.push({ text: "" });
  lines.push({
    text: renderCentered("Enter → Play Again  |  Q → Quit", width),
    style: { bold: true },
  });

  return lines;
}
