export { THEME } from "./theme.js";
export { textSegment, coloredTile, joinSegments, segmentLine } from "./segment-utils.js";

export {
  TERRAIN_LABELS,
  TERRAIN_COLORS,
  TERRAIN_FG,
  TERRAIN_LEGEND,
  TILE_WIDTH,
  TILE_HEIGHT,
  renderTile,
  renderTileSegment,
  renderDomino,
  renderLegend,
} from "./terrain.js";
export type { RenderTileOptions, RenderDominoOrientation, HighlightType } from "./terrain.js";

export { renderKingdomGrid } from "./kingdom-grid.js";
export type { KingdomGridProps } from "./kingdom-grid.js";

export { renderDraftColumn } from "./draft-column.js";
export type { DraftColumnProps } from "./draft-column.js";

export { renderTurnInfo } from "./turn-info.js";
export type { TurnInfoProps } from "./turn-info.js";

export { renderStatusBar } from "./status-bar.js";
export type { StatusBarProps, StatusBarPhase } from "./status-bar.js";

export { renderTransitionOverlay } from "./transition-overlay.js";
export type { TransitionOverlayProps } from "./transition-overlay.js";

export { renderResultsScreen } from "./results-screen-render.js";
export type { ResultsScreenProps } from "./results-screen-render.js";
