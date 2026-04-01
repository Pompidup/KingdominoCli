import { describe, it, expect } from "vitest";
import { mapErrorToFeedback } from "../error-feedback.js";

describe("mapErrorToFeedback", () => {
  it("maps INVALID_PLACEMENT to cursor flash", () => {
    const result = mapErrorToFeedback("INVALID_PLACEMENT", "Cannot place here");
    expect(result).toEqual({ target: "cursor", message: "Cannot place here", flash: true });
  });

  it("maps PLACEMENT_ prefixed codes to cursor flash", () => {
    const result = mapErrorToFeedback("PLACEMENT_OUT_OF_BOUNDS", "Out of bounds");
    expect(result).toEqual({ target: "cursor", message: "Out of bounds", flash: true });
  });

  it("maps DOMINO_ALREADY_PICKED to draft flash", () => {
    const result = mapErrorToFeedback("DOMINO_ALREADY_PICKED", "Already picked");
    expect(result).toEqual({ target: "draft", message: "Already picked", flash: true });
  });

  it("maps CANNOT_PICK to statusBar without flash", () => {
    const result = mapErrorToFeedback("CANNOT_PICK", "Cannot pick");
    expect(result).toEqual({ target: "statusBar", message: "Cannot pick", flash: false });
  });

  it("maps CANNOT_PLACE to statusBar without flash", () => {
    const result = mapErrorToFeedback("CANNOT_PLACE", "Cannot place");
    expect(result).toEqual({ target: "statusBar", message: "Cannot place", flash: false });
  });

  it("maps NOT_YOUR_TURN to debugOnly", () => {
    const result = mapErrorToFeedback("NOT_YOUR_TURN", "Not your turn");
    expect(result).toEqual({ target: "debugOnly", message: "Not your turn", flash: false });
  });

  it("maps INVALID_PLAYER_NAME to configName flash", () => {
    const result = mapErrorToFeedback("INVALID_PLAYER_NAME", "Bad name");
    expect(result).toEqual({ target: "configName", message: "Bad name", flash: true });
  });

  it("maps INVALID_PLAYER_COUNT to configPlayerCount flash", () => {
    const result = mapErrorToFeedback("INVALID_PLAYER_COUNT", "Bad count");
    expect(result).toEqual({ target: "configPlayerCount", message: "Bad count", flash: true });
  });

  it("maps unknown codes to statusBar without flash", () => {
    const result = mapErrorToFeedback("UNKNOWN_ERROR", "Something went wrong");
    expect(result).toEqual({ target: "statusBar", message: "Something went wrong", flash: false });
  });
});
