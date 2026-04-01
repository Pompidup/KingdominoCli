import type { ScreenName, ErrorState, TransitionState } from "../types.js";

export interface UIPort {
  switchScreen(screen: ScreenName): void;
  showError(error: ErrorState): void;
  showTransition(state: TransitionState): void;
  triggerAnimation(type: string, target: string): void;
}
