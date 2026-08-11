import { describe, test, expect } from "vitest";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";

// These files are PROMPTS, not code: spec-directive.md drives get_spec, and instructions.md is the
// canonical knowledge it draws on. Nothing else in the repo guards them, and every rule asserted
// below was installed after a live Author API run contradicted the recipe.
//
// The rules have now been rewritten TWICE by live evidence, in opposite directions. First the
// documented widget-type path turned out to restrict nothing, so the recipe was made to refuse
// any path. Then a differential run showed the restriction does work — via question_type_groups,
// overriding all ten default groups — and that the earlier "no effect" reading came from supplying
// a NEW group reference, which is additive: the config was in force and the picker looked
// untouched. Both readings were honest; only the comparison against a control separated them.
//
// So these assertions now pin the verified mechanism. If a future run contradicts it again, change
// them again — but only on evidence from a differential run, never from documentation alone.
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
  test("asserts the verified group path, and explains why all ten groups appear", () => {
    expect(directive).toContain("config.dependencies.question_editor_api.init_options.question_type_groups");
    expect(directive).toContain("overrides all ten default groups");
    // The trap that made this key read as inert: an unknown group reference is additive.
    expect(directive).toContain("ADDITIVE");
  });

  test("still refuses the paths that were shown not to restrict", () => {
    expect(directive).toContain("Never emit these");
    expect(directive).toContain("widgetTypes");
    expect(directive).toContain("widget_templates.widget_types");
  });

  test("question types stay intent — only groups are enforced", () => {
    expect(directive).toContain("Question TYPES are a different taxonomy");
    expect(directive).toContain("NOT restrictable");
    expect(directive).toContain("Do NOT invent a per-type config key");
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
  test("the restriction mechanism is recorded as verified, with its group references", () => {
    expect(instructions).toContain("MECHANISM VERIFIED");
    expect(instructions).toContain("question_type_groups");
    // Every group must be listed: restricting means overriding all ten.
    for (const g of ["mcq", "cloze", "match", "writespeak", "highlight",
      "math", "graph", "chart", "chemistry", "other"]) {
      expect(instructions).toContain(`\`${g}\``);
    }
  });

  test("the additive-reference trap is written down, with its measurements", () => {
    expect(instructions).toContain("ADDS");
    expect(instructions).toContain("restricts nothing");
    // The differential table is the evidence; without it the claim is just an assertion.
    expect(instructions).toContain("control (nothing set)");
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
