import { describe, it, expect, vi, afterEach } from "vitest";
import { createResultsScreen } from "../results-screen.js";
import type { StatePort } from "../../domain/ports/state-port.js";
import type { GamePort } from "../../domain/ports/game-port.js";

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

vi.mock("@pompidup/cligrid", () => {
  return {
    App: class MockApp {
      add = mockAppInstance.add;
      onKey = mockAppInstance.onKey;
      start = mockAppInstance.start;
      stop = mockAppInstance.stop;
      get isRunning() {
        return mockAppInstance.isRunning;
      }
    },
    createComponent: vi.fn((config: { id: string; render: unknown }) => ({
      id: config.id,
      setProps: vi.fn(),
      render: config.render,
    })),
  };
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  keyHandlers.clear();
  mockAppInstance.isRunning = true;
});

function simulateKey(combo: string) {
  const handler = keyHandlers.get(combo);
  if (handler) handler();
}

function createMockDeps() {
  const mockGameState = {
    players: [
      { id: "p1", name: "Alice", kingdom: [[{ type: "empty", crowns: 0 }]] },
      { id: "p2", name: "Bob", kingdom: [[{ type: "empty", crowns: 0 }]] },
    ],
  };

  const statePort = {
    getState: vi.fn().mockReturnValue({ gameState: mockGameState }),
    dispatch: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  } as unknown as StatePort;

  const gamePort = {
    getResults: vi.fn().mockReturnValue({
      ok: true,
      value: {
        result: [
          {
            playerId: "p1",
            playerName: "Alice",
            position: 1,
            details: { points: 40, maxPropertiesSize: 5, totalCrowns: 6 },
          },
          {
            playerId: "p2",
            playerName: "Bob",
            position: 2,
            details: { points: 20, maxPropertiesSize: 3, totalCrowns: 2 },
          },
        ],
      },
    }),
  } as unknown as GamePort;

  const onPlayAgain = vi.fn();
  const onQuit = vi.fn();

  return { statePort, gamePort, onPlayAgain, onQuit };
}

describe("createResultsScreen", () => {
  it("returns start and stop functions", () => {
    const deps = createMockDeps();
    const screen = createResultsScreen(deps);
    expect(screen.start).toBeInstanceOf(Function);
    expect(screen.stop).toBeInstanceOf(Function);
  });

  it("starts the app and loads results on start()", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    const screen = createResultsScreen(deps);
    screen.start();

    expect(mockAppInstance.start).toHaveBeenCalled();
    expect(deps.gamePort.getResults).toHaveBeenCalled();
    screen.stop();
  });

  it("calls onPlayAgain on Enter", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    createResultsScreen(deps);

    simulateKey("enter");

    expect(deps.onPlayAgain).toHaveBeenCalled();
  });

  it("calls onQuit on Q", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    createResultsScreen(deps);

    simulateKey("q");

    expect(deps.onQuit).toHaveBeenCalled();
  });

  it("calls onQuit on Ctrl+C", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    createResultsScreen(deps);

    simulateKey("ctrl+c");

    expect(deps.onQuit).toHaveBeenCalled();
  });

  it("stops the app on stop()", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    const screen = createResultsScreen(deps);
    screen.start();
    screen.stop();

    expect(mockAppInstance.stop).toHaveBeenCalled();
  });

  it("handles getResults failure gracefully", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    (deps.gamePort.getResults as ReturnType<typeof vi.fn>).mockReturnValue({
      ok: false,
      error: { code: "ERROR", message: "failed" },
    });

    const screen = createResultsScreen(deps);
    expect(() => screen.start()).not.toThrow();
    screen.stop();
  });

  it("handles missing gameState gracefully", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    (deps.statePort.getState as ReturnType<typeof vi.fn>).mockReturnValue({ gameState: null });

    const screen = createResultsScreen(deps);
    expect(() => screen.start()).not.toThrow();
    screen.stop();
  });

  it("runs score animation on start", () => {
    vi.useFakeTimers();
    const deps = createMockDeps();
    const screen = createResultsScreen(deps);
    screen.start();

    // Advance through animation
    vi.advanceTimersByTime(1600);

    screen.stop();
  });
});
