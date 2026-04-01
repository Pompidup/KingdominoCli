export type CliOptions = {
  debug: boolean;
  version: boolean;
  help: boolean;
};

export function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  return {
    debug: args.includes("--debug"),
    version: args.includes("--version") || args.includes("-v"),
    help: args.includes("--help") || args.includes("-h"),
  };
}

export const HELP_TEXT = `
Usage: kingdomino [options]

Options:
  --debug       Enable debug mode (verbose engine logging)
  --version, -v Show version number
  --help, -h    Show this help message

Controls:
  Title:   Enter to start
  Config:  Tab to navigate, Enter to confirm
  Game:    Arrow keys to move, R to rotate, Enter to place/pick
           D to discard (when no valid placement), Q to quit
  Results: Enter to play again, Q to quit
`.trim();
