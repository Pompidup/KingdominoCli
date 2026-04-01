import { describe, it, expect, vi, afterEach } from "vitest";
import { createTitleScreen } from "../title-screen.js";

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

describe("createTitleScreen", () => {
  it("returns start and stop functions", () => {
    const screen = createTitleScreen({ onNavigate: vi.fn() });
    expect(screen.start).toBeInstanceOf(Function);
    expect(screen.stop).toBeInstanceOf(Function);
  });

  it("starts the app on start()", () => {
    vi.useFakeTimers();
    const screen = createTitleScreen({ onNavigate: vi.fn() });
    screen.start();
    expect(mockAppInstance.start).toHaveBeenCalled();
    screen.stop();
  });

  it("calls onNavigate with config on Enter", () => {
    vi.useFakeTimers();
    const onNavigate = vi.fn();
    createTitleScreen({ onNavigate });

    simulateKey("enter");

    expect(onNavigate).toHaveBeenCalledWith("config");
  });

  it("stops the app on Ctrl+C", () => {
    vi.useFakeTimers();
    createTitleScreen({ onNavigate: vi.fn() });

    simulateKey("ctrl+c");

    expect(mockAppInstance.stop).toHaveBeenCalled();
  });

  it("stops the app on stop()", () => {
    vi.useFakeTimers();
    const screen = createTitleScreen({ onNavigate: vi.fn() });
    screen.start();
    screen.stop();

    expect(mockAppInstance.stop).toHaveBeenCalled();
  });
});
