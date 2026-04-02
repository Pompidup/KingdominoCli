import { App, createComponent } from "@pompidup/cligrid";
import type { RenderLine } from "@pompidup/cligrid";
import type { Locale } from "../i18n/index.js";
import { renderLogoLines, renderCentered } from "../presentation/ascii-art.js";

export type LanguageScreenDeps = {
  onSelect: (locale: Locale) => void;
};

const LANGUAGES: { locale: Locale; label: string; flag: string }[] = [
  { locale: "en", label: "English", flag: "EN" },
  { locale: "fr", label: "Français", flag: "FR" },
];

function renderLanguageScreen(selectedIndex: number, width: number): RenderLine[] {
  const lines: RenderLine[] = [];

  lines.push({ text: "" });
  lines.push(...renderLogoLines(width));
  lines.push({ text: "" });
  lines.push({ text: "" });

  lines.push({
    text: renderCentered("Select language / Choisir la langue", width),
    style: { bold: true, fg: "#f5d442" },
  });
  lines.push({ text: "" });

  for (let i = 0; i < LANGUAGES.length; i++) {
    const lang = LANGUAGES[i];
    const selected = i === selectedIndex;
    const indicator = selected ? "▸" : " ";
    const text = `${indicator}  [${lang.flag}]  ${lang.label}`;
    lines.push({
      text: renderCentered(text, width),
      style: selected ? { bold: true, fg: "#f5d442" } : {},
    });
  }

  lines.push({ text: "" });
  lines.push({ text: "" });
  lines.push({
    text: renderCentered("↑↓ Select  │  Enter: confirm", width),
    style: { dim: true },
  });

  return lines;
}

export function createLanguageScreen(deps: LanguageScreenDeps) {
  const { onSelect } = deps;
  const app = new App({ alternateScreen: true });
  let selectedIndex = 0;

  const screenComponent = createComponent({
    id: "language-screen",
    position: { x: 0, y: 0 },
    width: "100%",
    height: "100%",
    props: { selectedIndex: 0 },
    render: (_props, context) => {
      const width = context?.terminalWidth ?? 80;
      return renderLanguageScreen(_props.selectedIndex, width);
    },
  });

  app.add(screenComponent);

  app.onKey("up", () => {
    selectedIndex = Math.max(0, selectedIndex - 1);
    screenComponent.setProps({ selectedIndex });
  });

  app.onKey("down", () => {
    selectedIndex = Math.min(LANGUAGES.length - 1, selectedIndex + 1);
    screenComponent.setProps({ selectedIndex });
  });

  app.onKey("enter", () => {
    stop();
    onSelect(LANGUAGES[selectedIndex].locale);
  });

  app.onKey("ctrl+c", () => {
    stop();
  });

  function start() {
    app.start();
  }

  function stop() {
    if (app.isRunning) {
      app.stop();
    }
  }

  return { start, stop };
}
