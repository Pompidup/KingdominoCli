import { describe, it, expect, vi, afterEach } from "vitest";
import { createConfigScreen } from "../config-screen.js";
import type { GamePort } from "../../domain/ports/game-port.js";
import type { BotPort } from "../../domain/ports/bot-port.js";

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

function createMockDeps() {
  const gamePort: GamePort = {
    getModes: vi.fn(() => [{ name: "Classic", description: "" }]),
    getExtraRules: vi.fn(() => []),
    createGame: vi.fn(),
    addPlayers: vi.fn(),
    addExtraRules: vi.fn(),
    startGame: vi.fn(),
    chooseDomino: vi.fn(),
    placeDomino: vi.fn(),
    discardDomino: vi.fn(),
    getValidPlacements: vi.fn(() => []),
    canPlaceDomino: vi.fn(() => false),
    calculateScore: vi.fn(() => ({ points: 0, maxPropertiesSize: 0, totalCrowns: 0 })),
    getResults: vi.fn(),
  } as unknown as GamePort;

  const botPort: BotPort = {
    playBotTurn: vi.fn(),
    isBotTurn: vi.fn(() => false),
    getStrategyNames: vi.fn(() => ["random", "greedy", "advanced", "expert"]),
  };

  return {
    gamePort,
    botPort,
    onNavigate: vi.fn(),
    onStartGame: vi.fn(),
  };
}

afterEach(() => {
  vi.clearAllMocks();
  keyHandlers.clear();
  mockAppInstance.isRunning = true;
});

describe("createConfigScreen", () => {
  it("returns start and stop functions", () => {
    const screen = createConfigScreen(createMockDeps());
    expect(screen.start).toBeInstanceOf(Function);
    expect(screen.stop).toBeInstanceOf(Function);
  });

  it("starts the app", () => {
    const screen = createConfigScreen(createMockDeps());
    screen.start();
    expect(mockAppInstance.start).toHaveBeenCalled();
  });

  it("stops the app on Ctrl+C", () => {
    createConfigScreen(createMockDeps());
    simulateKey("ctrl+c");
    expect(mockAppInstance.stop).toHaveBeenCalled();
  });

  it("calls onStartGame on Enter when on start field", () => {
    const deps = createMockDeps();
    createConfigScreen(deps);

    // Navigate to "start" field: tab through playerCount, p1-name, p1-type, p2-name, p2-type, start
    for (let i = 0; i < 5; i++) {
      simulateKey("tab");
    }

    simulateKey("enter");
    expect(deps.onStartGame).toHaveBeenCalled();
  });

  it("does not call onStartGame when not on start field", () => {
    const deps = createMockDeps();
    createConfigScreen(deps);

    // On playerCount field (first field), Enter does nothing
    simulateKey("enter");
    expect(deps.onStartGame).not.toHaveBeenCalled();
  });

  it("navigates fields with Tab", () => {
    createConfigScreen(createMockDeps());
    // Should not throw
    simulateKey("tab");
    simulateKey("tab");
    simulateKey("tab");
  });

  it("handles up/down for value changes", () => {
    createConfigScreen(createMockDeps());
    // On playerCount, up/down changes count
    simulateKey("up");
    simulateKey("down");
  });
});
