import { describe, it, expect, vi, afterEach } from "vitest";
import { createGameScreen, findNextUnpickedIndex } from "../game-screen.js";
import type { GameScreenDeps } from "../game-screen.js";
import type { StatePort } from "../../domain/ports/state-port.js";
import type { GamePort } from "../../domain/ports/game-port.js";
import type { BotPort } from "../../domain/ports/bot-port.js";
import { INITIAL_APP_STATE } from "../../domain/types.js";
import type { AppState } from "../../domain/types.js";
import type { GameEngine, GameWithNextAction } from "@pompidup/kingdomino-engine";

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

function createMockBotPort(): BotPort {
  return {
    playBotTurn: vi.fn(() => ({ ok: true, value: {} })),
    isBotTurn: vi.fn(() => false),
    getStrategyNames: vi.fn(() => ["random"]),
  } as unknown as BotPort;
}

const mockEngine = {} as GameEngine;

function createDefaultDeps(overrides?: Partial<GameScreenDeps>): GameScreenDeps {
  return {
    statePort: createMockStatePort(),
    gamePort: createMockGamePort(),
    botPort: createMockBotPort(),
    getEngine: () => mockEngine,
    onNavigate: vi.fn(),
    ...overrides,
  };
}

afterEach(() => {
  vi.clearAllMocks();
  keyHandlers.clear();
  mockAppInstance.isRunning = true;
});

describe("createGameScreen", () => {
  it("returns start and stop functions", () => {
    const screen = createGameScreen(createDefaultDeps());
    expect(screen.start).toBeInstanceOf(Function);
    expect(screen.stop).toBeInstanceOf(Function);
  });

  it("starts the app and subscribes to state", () => {
    const statePort = createMockStatePort();
    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();
    expect(mockAppInstance.start).toHaveBeenCalled();
    expect(statePort.subscribe).toHaveBeenCalled();
  });

  it("stops the app and unsubscribes", () => {
    const statePort = createMockStatePort();
    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();
    screen.stop();
    expect(mockAppInstance.stop).toHaveBeenCalled();
  });

  it("stops on Ctrl+C", () => {
    createGameScreen(createDefaultDeps());
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

    createGameScreen(createDefaultDeps({ statePort }));

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

    createGameScreen(createDefaultDeps({ statePort }));

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

    createGameScreen(createDefaultDeps({ statePort }));

    simulateKey("up");
    simulateKey("enter");
    expect(statePort.dispatch).not.toHaveBeenCalled();
  });

  it("skips picked dominoes when navigating down in pick phase", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [
        { domino: { number: 1 }, picked: false, lordId: null, position: 0 },
        { domino: { number: 2 }, picked: true, lordId: "l2", position: 1 },
        { domino: { number: 3 }, picked: false, lordId: null, position: 2 },
      ],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
      draftSelection: 0,
    };
    const statePort = createMockStatePort(state);

    createGameScreen(createDefaultDeps({ statePort }));

    simulateKey("down");
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "SET_DRAFT_SELECTION", index: 2 });
  });

  it("skips picked dominoes when navigating up in pick phase", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [
        { domino: { number: 1 }, picked: false, lordId: null, position: 0 },
        { domino: { number: 2 }, picked: true, lordId: "l2", position: 1 },
        { domino: { number: 3 }, picked: false, lordId: null, position: 2 },
      ],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
      draftSelection: 2,
    };
    const statePort = createMockStatePort(state);

    createGameScreen(createDefaultDeps({ statePort }));

    simulateKey("up");
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "SET_DRAFT_SELECTION", index: 0 });
  });

  it("stays at current index when no unpicked domino in direction", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [
        { domino: { number: 1 }, picked: false, lordId: null, position: 0 },
        { domino: { number: 2 }, picked: true, lordId: "l2", position: 1 },
      ],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
      draftSelection: 0,
    };
    const statePort = createMockStatePort(state);

    createGameScreen(createDefaultDeps({ statePort }));

    simulateKey("down");
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "SET_DRAFT_SELECTION", index: 0 });
  });

  it("resets draft selection to first unpicked on pick phase entry", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [
        { domino: { number: 1 }, picked: true, lordId: "l2", position: 0 },
        { domino: { number: 2 }, picked: false, lordId: null, position: 1 },
        { domino: { number: 3 }, picked: false, lordId: null, position: 2 },
      ],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
      draftSelection: 0,
    };
    const statePort = createMockStatePort(state);
    let subscribeCallback: ((state: AppState) => void) | null = null;
    vi.mocked(statePort.subscribe).mockImplementation((listener) => {
      subscribeCallback = listener;
      return () => {};
    });

    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();

    // Trigger subscribe callback (simulates state change)
    subscribeCallback!(state);

    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "SET_DRAFT_SELECTION", index: 1 });
  });

  it("resets cursor and calculates valid placements on place phase entry", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [{ x: 4, y: 4 }] }],
      lords: [{ id: "l1", playerId: "p1", dominoPicked: { number: 1, left: {}, right: {} } }],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "placeDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
      cursor: { x: 7, y: 2, rotation: 90 },
    };
    const statePort = createMockStatePort(state);
    const gamePort = createMockGamePort();
    const fakePlacements = [{ position: { x: 3, y: 4 }, rotation: 0 }];
    vi.mocked(gamePort.getValidPlacements).mockReturnValue(fakePlacements);

    let subscribeCallback: ((state: AppState) => void) | null = null;
    vi.mocked(statePort.subscribe).mockImplementation((listener) => {
      subscribeCallback = listener;
      return () => {};
    });

    const screen = createGameScreen(createDefaultDeps({ statePort, gamePort }));
    screen.start();

    subscribeCallback!(state);

    expect(statePort.dispatch).toHaveBeenCalledWith({
      type: "SET_CURSOR",
      cursor: { x: 4, y: 4, rotation: 0 },
    });
    expect(statePort.dispatch).toHaveBeenCalledWith({
      type: "SET_VALID_PLACEMENTS",
      placements: fakePlacements,
    });
  });

  it("blocks discard when domino can still be placed", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [{ x: 4, y: 4 }] }],
      lords: [{ id: "l1", playerId: "p1", dominoPicked: { number: 1, left: {}, right: {} } }],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "placeDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
    };
    const statePort = createMockStatePort(state);
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.canPlaceDomino).mockReturnValue(true);

    createGameScreen(createDefaultDeps({ statePort, gamePort }));

    simulateKey("d");
    expect(gamePort.discardDomino).not.toHaveBeenCalled();
    expect(statePort.dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "SET_ERROR" }));
  });

  it("allows discard when domino cannot be placed", () => {
    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [{ x: 4, y: 4 }] }],
      lords: [{ id: "l1", playerId: "p1", dominoPicked: { number: 1, left: {}, right: {} } }],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "placeDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
    };
    const statePort = createMockStatePort(state);
    const gamePort = createMockGamePort();
    vi.mocked(gamePort.canPlaceDomino).mockReturnValue(false);

    createGameScreen(createDefaultDeps({ statePort, gamePort }));

    simulateKey("d");
    expect(gamePort.discardDomino).toHaveBeenCalled();
  });

  it("triggers bot loop after successful pick when next turn is bot", async () => {
    vi.useFakeTimers();

    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Alice", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [{ domino: { number: 1 }, picked: false, lordId: null, position: 0 }],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const afterPickGame = {
      ...fakeGame,
      nextAction: { type: "action", nextLord: "l2", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const afterBotGame = {
      ...fakeGame,
      nextAction: { type: "action", nextLord: "l1", nextAction: "placeDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
      draftSelection: 0,
    };

    const statePort = createMockStatePort(state);
    const gamePort = createMockGamePort();
    const botPort = createMockBotPort();

    vi.mocked(gamePort.chooseDomino).mockReturnValue({ ok: true, value: afterPickGame });
    // After pick, isBotTurn returns true once, then false
    vi.mocked(botPort.isBotTurn)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    vi.mocked(botPort.playBotTurn).mockReturnValue({ ok: true, value: afterBotGame });

    // Return the updated state after bot dispatches
    let callCount = 0;
    vi.mocked(statePort.getState).mockImplementation(() => {
      callCount++;
      if (callCount <= 2) return state;
      return { ...state, gameState: afterPickGame };
    });

    createGameScreen(createDefaultDeps({ statePort, gamePort, botPort }));

    simulateKey("enter");

    // Advance past the 400ms delay
    await vi.advanceTimersByTimeAsync(400);
    expect(botPort.playBotTurn).toHaveBeenCalled();
    expect(statePort.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_BOT_PLAYING" }),
    );

    // Advance past the 200ms post-bot delay
    await vi.advanceTimersByTimeAsync(200);

    vi.useRealTimers();
  });

  it("ignores input when transition is active", () => {
    const state: AppState = {
      ...INITIAL_APP_STATE,
      transition: { active: true, playerName: "Alice" },
    };
    const statePort = createMockStatePort(state);

    createGameScreen(createDefaultDeps({ statePort }));

    simulateKey("up");
    simulateKey("enter");
    expect(statePort.dispatch).not.toHaveBeenCalled();
  });

  it("auto-clears error after 1500ms", () => {
    vi.useFakeTimers();

    const state: AppState = {
      ...INITIAL_APP_STATE,
      error: { code: "TEST", message: "test error", timestamp: Date.now() },
    };
    const statePort = createMockStatePort(state);
    let subscribeCallback: ((state: AppState) => void) | null = null;
    vi.mocked(statePort.subscribe).mockImplementation((listener) => {
      subscribeCallback = listener;
      return () => {};
    });

    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();

    // Trigger subscriber
    subscribeCallback!(state);

    // Not cleared yet
    expect(statePort.dispatch).not.toHaveBeenCalledWith({ type: "CLEAR_ERROR" });

    // After 1500ms
    vi.advanceTimersByTime(1500);
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "CLEAR_ERROR" });

    vi.useRealTimers();
  });

  it("resets error clear timer on new error", () => {
    vi.useFakeTimers();

    const state: AppState = {
      ...INITIAL_APP_STATE,
      error: { code: "TEST", message: "first error", timestamp: Date.now() },
    };
    const statePort = createMockStatePort(state);
    let subscribeCallback: ((state: AppState) => void) | null = null;
    vi.mocked(statePort.subscribe).mockImplementation((listener) => {
      subscribeCallback = listener;
      return () => {};
    });

    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();

    // First error triggers timer
    subscribeCallback!(state);
    vi.advanceTimersByTime(1000);

    // New error resets timer
    const state2 = {
      ...state,
      error: { code: "TEST2", message: "second error", timestamp: Date.now() + 1000 },
    };
    vi.mocked(statePort.getState).mockReturnValue(state2);
    subscribeCallback!(state2);

    // Original 1500ms passed but timer was reset
    vi.advanceTimersByTime(500);
    expect(statePort.dispatch).not.toHaveBeenCalledWith({ type: "CLEAR_ERROR" });

    // Full 1500ms from reset
    vi.advanceTimersByTime(1000);
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "CLEAR_ERROR" });

    vi.useRealTimers();
  });

  it("dispatches transition on player change", () => {
    vi.useFakeTimers();

    const fakeGame1 = {
      id: "g1",
      players: [
        { id: "p1", name: "Alice", kingdom: [] },
        { id: "p2", name: "Bob", kingdom: [] },
      ],
      lords: [
        { id: "l1", playerId: "p1" },
        { id: "l2", playerId: "p2" },
      ],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const fakeGame2 = {
      ...fakeGame1,
      nextAction: { type: "action", nextLord: "l2", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state1: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame1,
    };

    const statePort = createMockStatePort(state1);
    let subscribeCallback: ((state: AppState) => void) | null = null;
    vi.mocked(statePort.subscribe).mockImplementation((listener) => {
      subscribeCallback = listener;
      return () => {};
    });

    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();

    // First subscribe call sets prevPlayerId
    subscribeCallback!(state1);

    // Change to player 2
    const state2 = { ...state1, gameState: fakeGame2 };
    vi.mocked(statePort.getState).mockReturnValue(state2);
    subscribeCallback!(state2);

    expect(statePort.dispatch).toHaveBeenCalledWith({
      type: "SET_TRANSITION",
      transition: { active: true, playerName: "Bob" },
    });

    // After 800ms, transition should be cleared
    vi.advanceTimersByTime(800);
    expect(statePort.dispatch).toHaveBeenCalledWith({
      type: "SET_TRANSITION",
      transition: { active: false, playerName: "" },
    });

    vi.useRealTimers();
  });

  it("does not dispatch transition during bot turns", () => {
    const fakeGame1 = {
      id: "g1",
      players: [
        { id: "p1", name: "Alice", kingdom: [] },
        { id: "p2", name: "Bot", kingdom: [] },
      ],
      lords: [
        { id: "l1", playerId: "p1" },
        { id: "l2", playerId: "p2" },
      ],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const fakeGame2 = {
      ...fakeGame1,
      nextAction: { type: "action", nextLord: "l2", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state1: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame1,
    };

    const statePort = createMockStatePort(state1);
    let subscribeCallback: ((state: AppState) => void) | null = null;
    vi.mocked(statePort.subscribe).mockImplementation((listener) => {
      subscribeCallback = listener;
      return () => {};
    });

    const screen = createGameScreen(createDefaultDeps({ statePort }));
    screen.start();

    // First call sets prevPlayerId
    subscribeCallback!(state1);

    // Change to player 2 but botPlaying is true
    const state2 = { ...state1, gameState: fakeGame2, botPlaying: true };
    vi.mocked(statePort.getState).mockReturnValue(state2);
    subscribeCallback!(state2);

    expect(statePort.dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "SET_TRANSITION" }),
    );
  });

  it("calls checkAndRunBots on start if first turn is bot", async () => {
    vi.useFakeTimers();

    const fakeGame = {
      id: "g1",
      players: [{ id: "p1", name: "Bot1", kingdom: [] }],
      lords: [{ id: "l1", playerId: "p1" }],
      currentDominoes: [],
      nextAction: { type: "action", nextLord: "l1", nextAction: "pickDomino" },
    } as unknown as GameWithNextAction;

    const state: AppState = {
      ...INITIAL_APP_STATE,
      screen: "game",
      gameState: fakeGame,
    };

    const statePort = createMockStatePort(state);
    const botPort = createMockBotPort();
    // checkAndRunBots calls isBotTurn once, then runBotLoop while-condition calls it again
    vi.mocked(botPort.isBotTurn)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValue(false);
    vi.mocked(botPort.playBotTurn).mockReturnValue({ ok: true, value: fakeGame });

    const screen = createGameScreen(createDefaultDeps({ statePort, botPort }));
    screen.start();

    await vi.advanceTimersByTimeAsync(400);
    expect(botPort.playBotTurn).toHaveBeenCalled();
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "SET_BOT_PLAYING", playing: true });

    await vi.advanceTimersByTimeAsync(200);
    expect(statePort.dispatch).toHaveBeenCalledWith({ type: "SET_BOT_PLAYING", playing: false });

    vi.useRealTimers();
  });
});

describe("findNextUnpickedIndex", () => {
  const makeDominoes = (pickedFlags: boolean[]) =>
    pickedFlags.map((picked, i) => ({
      domino: { number: i + 1 },
      picked,
      lordId: picked ? `l${i}` : null,
      position: i,
    })) as unknown as Parameters<typeof findNextUnpickedIndex>[0];

  it("finds next unpicked going down", () => {
    const dominoes = makeDominoes([false, true, false]);
    expect(findNextUnpickedIndex(dominoes, 0, 1)).toBe(2);
  });

  it("finds next unpicked going up", () => {
    const dominoes = makeDominoes([false, true, false]);
    expect(findNextUnpickedIndex(dominoes, 2, -1)).toBe(0);
  });

  it("returns current index if no unpicked in direction", () => {
    const dominoes = makeDominoes([false, true, true]);
    expect(findNextUnpickedIndex(dominoes, 0, 1)).toBe(0);
  });

  it("skips multiple picked dominoes", () => {
    const dominoes = makeDominoes([false, true, true, false]);
    expect(findNextUnpickedIndex(dominoes, 0, 1)).toBe(3);
  });
});
