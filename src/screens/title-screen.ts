import { App, createComponent } from "@pompidup/cligrid";
import type { ScreenName } from "../domain/types.js";
import { renderTitleScreen } from "../presentation/title-screen-render.js";

export type TitleScreenDeps = {
  onNavigate: (screen: ScreenName) => void;
};

export function createTitleScreen(deps: TitleScreenDeps) {
  const { onNavigate } = deps;
  const app = new App({ alternateScreen: true });
  let pulseInterval: ReturnType<typeof setInterval> | null = null;
  let showPrompt = true;

  const screenComponent = createComponent({
    id: "title-screen",
    position: { x: 0, y: 0 },
    width: "100%",
    height: "100%",
    props: { showPrompt: true },
    render: (_props, context) => {
      const width = context?.terminalWidth ?? 80;
      return renderTitleScreen({ width, showPrompt: _props.showPrompt });
    },
  });

  app.add(screenComponent);

  app.onKey("enter", () => {
    stop();
    onNavigate("config");
  });

  app.onKey("ctrl+c", () => {
    stop();
  });

  function start() {
    app.start();
    pulseInterval = setInterval(() => {
      showPrompt = !showPrompt;
      screenComponent.setProps({ showPrompt });
    }, 500);
  }

  function stop() {
    if (pulseInterval) {
      clearInterval(pulseInterval);
      pulseInterval = null;
    }
    if (app.isRunning) {
      app.stop();
    }
  }

  return { start, stop };
}
