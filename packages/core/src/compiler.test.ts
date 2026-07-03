// SPDX-License-Identifier: MIT
// Unit tests for the L0177 authoring-integration oracle. The compiled output is
// a structural PROOF object (not Learnosity item JSON); these assert its shape
// and the validation error paths.
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

describe("proof path", () => {
  test("embed-editor produces a structural proof and signs locally", async () => {
    const out = await compile(
      'integration {operation: "embed-editor", user: "u123", domain: "lms.acme.edu", widgets: ["mcq", "clozetext"]}..',
    );
    expect(out.verified).toBe(true);
    expect(out.operation).toBe("embed-editor");
    expect(out.signed).toBe(true);
    expect(out.widgets).toEqual(["mcq", "clozetext"]);
    expect(out.signedWithRealCredentials).toBe(false);
  });

  test("a data-api operation validates without signing", async () => {
    const out = await compile('integration {operation: "list-items"}..');
    expect(out.verified).toBe(true);
    expect(out.operation).toBe("list-items");
    expect(out.signed).toBe(false);
  });

  test("program-supplied credentials mark the proof as real-credentialed", async () => {
    const out = await compile(
      'set-var "learnosity-key" "k" set-var "learnosity-secret" "s" integration {operation: "embed-editor", user: "u", domain: "d"}..',
    );
    expect(out.signed).toBe(true);
    expect(out.signedWithRealCredentials).toBe(true);
  });
});

describe("error paths", () => {
  test("unknown operation errors", async () => {
    await expect(compile('integration {operation: "frobnicate"}..')).rejects.toBeTruthy();
  });

  test("embed-editor without domain errors", async () => {
    await expect(compile('integration {operation: "embed-editor", user: "u123"}..')).rejects.toBeTruthy();
  });

  test("unknown widget type errors", async () => {
    await expect(
      compile('integration {operation: "embed-editor", user: "u", domain: "d", widgets: ["notawidget"]}..'),
    ).rejects.toBeTruthy();
  });

  test("only one of key/secret errors", async () => {
    await expect(
      compile('set-var "learnosity-key" "k" integration {operation: "list-items"}..'),
    ).rejects.toBeTruthy();
  });
});
