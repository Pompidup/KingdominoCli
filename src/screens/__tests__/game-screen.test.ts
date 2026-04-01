import { describe, it, expect, vi, afterEach } from "vitest";
import { createGameScreen } from "../game-screen.js";
import type { StatePort } from "../../domain/ports/state-port.js";
import type { GamePort } from "../../domain/ports/game-port.js";
import { INITIAL_APP_STATE } from "../../domain/types.js";
import type { AppState } from "../../domain/types.js";
import type { GameWithNextAction } from "@pompidup/kingdomino-engine";

const keyHandlers = new Map<string, () => void>();
const mockAppInstance = {
  add: vi.fn(),
  onKey: vi.fn((combo: string, handler: () => void) => {
    keyHandlers.set(combo, handler);
    return mockAppInstance;
  }),
  start: vi.fn(),
  stop: vi.fn(),
  isRunning: true,
};

vi.mock("@pompidup/cligrid", () => ({
  App: class MockApp {
    add = mockAppInstance.add;
    onKey = mockAppInstance.onKey;
    start = mockAppInstance.start;
    stop = mockAppInstance.stop;
    get isRunning() {
      return mockAppInstance.isRunning;
    }
  },
  createComponent: vi.fn((config: { id: string; render: unknown; props: unknown }) => ({
    id: config.id,
    setProps: vi.fn(),
    render: config.render,
    props: config.props,
  })),
}));

function simulateKey(combo: string) {
  const handler = keyHandlers.get(combo);
  if (handler) handler();
}

function createMockStatePort(state: AppState = INITIAL_APP_STATE): StatePort {
  const listeners = new Set<(state: AppState) => void>();
  return {
    getState: vi.fn(() => state),
    dispatch: vi.fn(),
    subscribe: vi.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };
}

function createMockGamePort(): GamePort {
  return {
    getModes: vi.fn(() => []),
    getExtraRules: vi.fn(() => []),
    createGame: vi.fn(),
    addPlayers: vi.fn(),
    addExtraRules: vi.fn(),
    startGame: vi.fn(),
    chooseDomino: vi.fn(() => ({ ok: true, value: {} })),
    placeDomino: vi.fn(() => ({ ok: true, value: {} })),
    discardDomino: vi.fn(() => ({ ok: true, value: {} })),
    getValidPlacements: vi.fn(() => []),
    canPlaceDomino: vi.fn(() => false),
    calculateScore: vi.fn(() => ({ points: 0, maxPropertiesSize: 0, totalCrowns: 0 })),
    getResults: vi.fn(),
  } as unknown as GamePort;
}

afterEach(() => {
  vi.clearAllMocks();
  keyHandlers.clear();
  mockAppInstance.isRunning = true;
});

describe("createGameScreen", () => {
  it("returns start and stop functions", () => {
    const screen = createGameScreen({
      statePort: createMockStatePort(),
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });
    expect(screen.start).toBeInstanceOf(Function);
    expect(screen.stop).toBeInstanceOf(Function);
  });

  it("starts the app and subscribes to state", () => {
    const statePort = createMockStatePort();
    const screen = createGameScreen({
      statePort,
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });
    screen.start();
    expect(mockAppInstance.start).toHaveBeenCalled();
    expect(statePort.subscribe).toHaveBeenCalled();
  });

  it("stops the app and unsubscribes", () => {
    const statePort = createMockStatePort();
    const screen = createGameScreen({
      statePort,
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });
    screen.start();
    screen.stop();
    expect(mockAppInstance.stop).toHaveBeenCalled();
  });

  it("stops on Ctrl+C", () => {
    createGameScreen({
      statePort: createMockStatePort(),
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });
    simulateKey("ctrl+c");
    expect(mockAppInstance.stop).toHaveBeenCalled();
  });

  it("dispatches cursor movement on arrow keys during place phase", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "placeDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
    };
    const statePort = createMockStatePort(state);

    createGameScreen({
      statePort,
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });

    simulateKey("up");
    expect(statePort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_CURSOR" }),
    );
  });

  it("dispatches draft selection on up/down during pick phase", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [
        {
          domino: {
            left: { type: "wheat", crowns: 0 },
            right: { type: "sea", crowns: 0 },
            number: 1,
          },
          picked: false,
          lordId: null,
          position: 0,
        },
        {
          domino: {
            left: { type: "wheat", crowns: 0 },
            right: { type: "sea", crowns: 0 },
            number: 2,
          },
          picked: false,
          lordId: null,
          position: 1,
        },
      ],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
    };
    const statePort = createMockStatePort(state);

    createGameScreen({
      statePort,
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });

    simulateKey("down");
    expect(statePort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_DRAFT_SELECTION" }),
    );
  });

  it("ignores input when bot is playing", () => {
    const state: AppState = {
      ...INITIAL_APP_STATE,
      botPlaying: true,
    };
    const statePort = createMockStatePort(state);

    createGameScreen({
      statePort,
      gamePort: createMockGamePort(),
      onNavigate: vi.fn(),
    });

    simulateKey("up");
    simulateKey("enter");
    expect(statePort.dispatch).not.toHaveBeenCalled();
  });
});
