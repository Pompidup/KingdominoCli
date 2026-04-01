export { StateManager } from "./state-manager.js";
export {
  getActiveLord,
  getActivePlayer,
  getCurrentDomino,
  getCurrentAction,
  getDraftDominoes,
  getKingdomForDisplay,
  getScores,
} from "./selectors.js";
export { orchestrateGameSetup } from "./game-orchestrator.js";
export type { OrchestratorDeps } from "./game-orchestrator.js";
export { mapErrorToFeedback } from "./error-feedback.js";
export type { ErrorFeedback, FeedbackTarget } from "./error-feedback.js";
