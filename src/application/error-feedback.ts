export type FeedbackTarget =
  | "cursor"
  | "draft"
  | "statusBar"
  | "configName"
  | "configPlayerCount"
  | "debugOnly";

export type ErrorFeedback = {
  target: FeedbackTarget;
  message: string;
  flash: boolean;
};

export function mapErrorToFeedback(code: string, message: string): ErrorFeedback {
  if (code.startsWith("INVALID_PLACEMENT") || code.startsWith("PLACEMENT_")) {
    return { target: "cursor", message, flash: true };
  }

  switch (code) {
    case "DOMINO_ALREADY_PICKED":
      return { target: "draft", message, flash: true };
    case "CANNOT_PICK":
    case "CANNOT_PLACE":
      return { target: "statusBar", message, flash: false };
    case "NOT_YOUR_TURN":
      return { target: "debugOnly", message, flash: false };
    case "INVALID_PLAYER_NAME":
      return { target: "configName", message, flash: true };
    case "INVALID_PLAYER_COUNT":
      return { target: "configPlayerCount", message, flash: true };
    default:
      return { target: "statusBar", message, flash: false };
  }
}
