import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// These files are PROMPTS, not code: spec-directive.md drives get_spec, and instructions.md is the
// canonical knowledge it draws on. Nothing else in the repo guards them, and every rule asserted
// below is one we installed after the live Author API contradicted the recipe (commits c09225c..
// 08be3cc). Delete a rule by accident and the generator quietly goes back to asserting a config
// path that does nothing.
//
// What this test does NOT do: it pins the prompt, not the output. A passing run says the rules are
// still written down — it cannot tell you the generator obeyed them. Recipe generation is sampled,
// and we have watched a rule hold in one generation and lapse in the next. Catching that needs an
// eval over N generations, not a unit test.

const read = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../spec/${name}`, import.meta.url)), "utf-8")
    // Prettier formats spec/*.md (there is no .prettierignore), so it may rewrap any of these
    // lines. Match on whitespace-normalized substrings, never on exact lines or line numbers.
    .replace(/\s+/g, " ");

const directive = read("spec-directive.md");
const instructions = read("instructions.md");

describe("spec-directive.md keeps the rules the live API taught us", () => {
  test("refuses to assert a config path for widget-type restriction", () => {
    expect(directive).toContain("never assert a config path");
    // The old path must appear as a banned path, not as an instruction.
    expect(directive).toContain("restricts NOTHING");
    expect(directive).toContain("do NOT substitute another guess");
  });

  test("config-behaviour checks must be differential, including enabling keys", () => {
    expect(directive).toContain("must be differential");
    expect(directive).toContain("including ENABLING keys");
    // The specific hole the generator slipped through: a bare "confirm editing works".
    expect(directive).toContain("wearing a positive sign");
  });

  test("the Goal states intent, never an accomplished restriction", () => {
    expect(directive).toContain("MUST NOT claim the editor");
    expect(directive).toContain("pending verification");
  });

  test("gotchas mandate the two silent failures", () => {
    expect(directive).toContain("fails open on"); // unrecognized config key is ignored
    expect(directive).toContain("versioned script URL 404s"); // blank page, neither callback fires
  });

  test("widget permissions point at the real path, not widget_templates", () => {
    expect(directive).toContain("config.item_edit.widget.edit");
    expect(directive).toContain("widget_templates");
    expect(directive).toContain("supported by nothing");
  });
});

describe("instructions.md keeps the canonical knowledge honest", () => {
  test("the widget-type restriction is marked unverified, not documented as working", () => {
    expect(instructions).toContain("MECHANISM UNVERIFIED");
    expect(instructions).toContain("does not restrict anything");
  });

  test("fail-open semantics are recorded — the root cause of the bad recipe", () => {
    expect(instructions).toContain("FAILS OPEN");
  });
});

describe("the directive actually ships", () => {
  test("build-static copies spec-directive.md into the served bundle", () => {
    // build-static.js copies under an existsSync() guard, so a rename or deletion would silently
    // stop publishing the directive rather than failing the build.
    const buildStatic = readFileSync(
      fileURLToPath(new URL("../tools/build-static.js", import.meta.url)),
      "utf-8",
    );
    expect(buildStatic).toContain("spec-directive.md");
  });
});
