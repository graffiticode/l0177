// SPDX-License-Identifier: MIT
// Unit tests for the L0177 Author API integration oracle. The compiled `data` is
// a normalized echo of the design plus `warnings` (steering hints). These assert
// the validation, the design-hole warnings, progressive disclosure, cross-field
// coherence, and the rare error path.
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

describe("design completeness", () => {
  test("a fully-specified item-edit design compiles with no warnings", async () => {
    const out = await compile(
      'author-item-edit { domain: "lms.acme.edu", user: { id: "u123" }, reference: "item-1", allow_widgets: ["mcq", "clozetext"], edit_widgets: true, organisation_id: 100 }..',
    );
    expect(out.mode).toBe("item_edit");
    expect(out.complete).toBe(true);
    expect(out.warnings).toEqual([]);
    expect(out.allow_widgets).toEqual(["mcq", "clozetext"]);
  });

  test("each construct maps to its Author API mode", async () => {
    const list = await compile('author-item-list { domain: "d", user: { id: "u" } }..');
    expect(list.mode).toBe("item_list");
    const act = await compile('author-activity-list { domain: "d", user: { id: "u" } }..');
    expect(act.mode).toBe("activity_list");
  });
});

describe("design-hole warnings (dominant)", () => {
  test("an empty item-edit design flags domain, author, and reference holes", async () => {
    const out = await compile("author-item-edit {}..");
    expect(out.complete).toBe(false);
    expect(hasWarning(out, "domain")).toBe(true);
    expect(hasWarning(out, "author")).toBe(true);
    expect(hasWarning(out, "reference")).toBe(true);
  });
});

describe("progressive disclosure", () => {
  test("with holes filled, specificity advisories surface instead", async () => {
    const out = await compile(
      'author-item-edit { domain: "d", user: { id: "u" }, reference: "r" }..',
    );
    expect(out.complete).toBe(true);
    // holes are gone; specificity advisories now appear
    expect(hasWarning(out, "domain")).toBe(false);
    expect(hasWarning(out, "widget types")).toBe(true);
    expect(hasWarning(out, "permissions")).toBe(true);
  });
});

describe("cross-field coherence", () => {
  test("edit toggles in a list view warn (misplaced), not error", async () => {
    const out = await compile(
      'author-item-list { domain: "d", user: { id: "u" }, edit_widgets: true }..',
    );
    expect(out.mode).toBe("item_list");
    expect(hasWarning(out, "ignored here")).toBe(true);
  });
});

describe("value checks", () => {
  test("an unknown widget type warns (not a hard error)", async () => {
    const out = await compile(
      'author-item-edit { domain: "d", user: { id: "u" }, reference: "r", allow_widgets: ["notawidget"] }..',
    );
    expect(hasWarning(out, "aren't learnosity widget types")).toBe(true);
  });
});

describe("rare error path", () => {
  test("a non-record argument errors", async () => {
    await expect(compile('author-item-edit "nope"..')).rejects.toBeTruthy();
  });
});
