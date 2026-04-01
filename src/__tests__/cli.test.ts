import { describe, it, expect } from "vitest";
import { parseArgs, HELP_TEXT } from "../cli.js";

describe("parseArgs", () => {
  it("returns all false for no args", () => {
    const opts = parseArgs(["node", "index.js"]);
    expect(opts).toEqual({ debug: false, version: false, help: false });
  });

  it("parses --debug flag", () => {
    const opts = parseArgs(["node", "index.js", "--debug"]);
    expect(opts.debug).toBe(true);
  });

  it("parses --version flag", () => {
    const opts = parseArgs(["node", "index.js", "--version"]);
    expect(opts.version).toBe(true);
  });

  it("parses -v shorthand for version", () => {
    const opts = parseArgs(["node", "index.js", "-v"]);
    expect(opts.version).toBe(true);
  });

  it("parses --help flag", () => {
    const opts = parseArgs(["node", "index.js", "--help"]);
    expect(opts.help).toBe(true);
  });

  it("parses -h shorthand for help", () => {
    const opts = parseArgs(["node", "index.js", "-h"]);
    expect(opts.help).toBe(true);
  });

  it("parses multiple flags", () => {
    const opts = parseArgs(["node", "index.js", "--debug", "--version"]);
    expect(opts.debug).toBe(true);
    expect(opts.version).toBe(true);
  });

  it("ignores unknown flags", () => {
    const opts = parseArgs(["node", "index.js", "--unknown"]);
    expect(opts).toEqual({ debug: false, version: false, help: false });
  });
});

describe("HELP_TEXT", () => {
  it("contains usage information", () => {
    expect(HELP_TEXT).toContain("Usage: kingdomino");
  });

  it("documents all flags", () => {
    expect(HELP_TEXT).toContain("--debug");
    expect(HELP_TEXT).toContain("--version");
    expect(HELP_TEXT).toContain("--help");
  });
});
