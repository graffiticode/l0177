// SPDX-License-Identifier: MIT
// Unit tests for the L0177 Author API integration oracle. Uniform surface: every
// property is an arity-2 kebab function; members are arity-1; views select the
// mode; widget-type enum values are UPPERCASE tags. These assert per-property
// validation, view/mode mapping, design-hole warnings, progressive disclosure,
// cross-context coherence, and that unknown properties are parse errors.
import { describe, test, expect } from "vitest";
import { parser } from "@graffiticode/parser";
import { compiler, lexicon } from "./index.js";

async function compile(src: string, data: any = {}, config: any = {}): Promise<any> {
  const code = await parser.parse(177, src, lexicon);
  return await new Promise((resolve, reject) => {
    compiler.compile(code, data, config, (err: any, val: any) => {
      const errors = Array.isArray(err) ? err.filter(Boolean) : err ? [err] : [];
      if (errors.length > 0) reject(errors);
      else resolve(val);
    });
  });
}
const hasWarning = (out: any, needle: string) =>
  (out.warnings || []).some((w: string) => w.toLowerCase().includes(needle.toLowerCase()));

const COMPLETE = `author-embed
  domain "lms.acme.edu"
  user-id "u123"
  reference "algebra-item-1"
  organisation-id 123
  allow-widgets [MCQ CLOZE-TEXT FORMULA]
  item-edit [
    item back true scoring true reference-prefix "LEAR_" {}
    widget edit true delete false {}
  ]
  container height 600 {}
  {}..`;

describe("complete design + tags", () => {
  test("a fully-specified item-edit design compiles with no warnings", async () => {
    const out = await compile(COMPLETE);
    expect(out.mode).toBe("item_edit");
    expect(out.complete).toBe(true);
    expect(out.warnings).toEqual([]);
    expect(out.allow_widgets).toEqual(["mcq", "clozetext", "formula"]); // uppercase tags mapped
    expect(out.config.item).toMatchObject({ back: true, scoring: true, "reference-prefix": "LEAR_" });
    expect(out.config.widget).toEqual({ edit: true, delete: false });
  });

  test("each view function maps to its Learnosity mode", async () => {
    const al = await compile('author-embed domain "d" user-id "u" activity-list [] {}..');
    expect(al.mode).toBe("activity_list");
    expect(hasWarning(al, "isn't fully modeled yet")).toBe(true);
  });
});

describe("design holes (progressive disclosure)", () => {
  test("no view flags the view hole", async () => {
    const out = await compile('author-embed domain "d" user-id "u" {}..');
    expect(out.complete).toBe(false);
    expect(hasWarning(out, "which authoring view")).toBe(true);
  });

  test("bare item-edit flags domain, author, reference; suppresses specificity", async () => {
    const out = await compile("author-embed item-edit [ item {} ] {}..");
    expect(out.mode).toBe("item_edit");
    expect(out.complete).toBe(false);
    expect(hasWarning(out, "domain")).toBe(true);
    expect(hasWarning(out, "author")).toBe(true);
    expect(hasWarning(out, "reference")).toBe(true);
    expect(hasWarning(out, "item bank")).toBe(false);
  });

  test("holes filled → specificity advisories surface", async () => {
    const out = await compile('author-embed domain "d" user-id "u" reference "r" item-edit [ item {} ] {}..');
    expect(out.complete).toBe(true);
    expect(hasWarning(out, "allow-widgets")).toBe(true);
    expect(hasWarning(out, "item bank")).toBe(true);
  });
});

describe("view-scoped members", () => {
  test("a member the view rejects is dropped, not folded into config", async () => {
    const out = await compile('author-embed domain "d" user-id "u" item-list [ item back true {} widget edit true delete false {} ] {}..');
    expect(out.mode).toBe("item_list");
    expect(out.config.widget).toBeUndefined(); // item_list has no widgets to edit/delete
    expect(out.config.item).toEqual({ back: true }); // an accepted member still lands
    expect(hasWarning(out, `item-list: "widget" isn't a member of this view`)).toBe(true);
  });

  test("validity warnings surface even while design holes remain", async () => {
    const out = await compile("author-embed item-list [ widget edit true {} ] {}..");
    expect(out.complete).toBe(false);
    expect(hasWarning(out, "domain")).toBe(true); // holes still lead
    expect(hasWarning(out, "dropped")).toBe(true); // ...but the drop isn't silent
    expect(hasWarning(out, "item bank")).toBe(false); // specificity still deferred
  });
});

describe("per-property + cross-context validation", () => {
  test("a wrong-typed property warns", async () => {
    const out = await compile('author-embed domain "d" user-id "u" reference "r" item-edit [ item back "yes" {} ] {}..');
    expect(hasWarning(out, "back must be true or false")).toBe(true);
  });

  test("a property used in the wrong member warns", async () => {
    const out = await compile('author-embed domain "d" user-id "u" reference "r" item-edit [ item edit true {} ] {}..');
    expect(hasWarning(out, `item: "edit" isn't a valid item property`)).toBe(true);
  });

  test("an unknown property is a parse error", async () => {
    await expect(compile('author-embed item-edit [ item wibble true {} ] {}..')).rejects.toBeTruthy();
  });
});
