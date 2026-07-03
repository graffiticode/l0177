// SPDX-License-Identifier: MIT
/* Copyright (c) 2023, ARTCOMPILER INC */
// L0177 — Learnosity Authoring Integration oracle.
//
// Unlike L0176 (which authors Learnosity item *content*), L0177 models an
// authoring-INTEGRATION operation and its parameters. The compiled `data` is a
// structural PROOF that the operation's request constructs and signs locally
// (HMAC only, no network) — it is NOT the deliverable. The developer-facing
// RECIPE is produced by get_spec from the program's AST + instructions.md +
// spec-directive.md. So the compiler's job here is: validate the operation +
// params, and prove the request is well-formed.
import {
  Checker as BaseChecker,
  Transformer as BaseTransformer,
  Compiler,
} from "@graffiticode/l0000";
import LearnositySDK from "learnosity-sdk-nodejs";
import { buildInitAuthor } from "./author.js";

// Unwrap L0000's internal Record representation ({_type:"record", _entries:Map})
// to plain JS, stripping the tag:/str:/num: key prefixes. Identical to L0176.
function toPlainObject(val: any): any {
  if (val !== null && typeof val === "object" && val._type === "record" && val._entries instanceof Map) {
    const obj: any = {};
    for (const [k, v] of val._entries) {
      const name = (k as string).replace(/^(tag|str|num):/, "");
      obj[name] = toPlainObject(v);
    }
    return obj;
  }
  if (Array.isArray(val)) return val.map(toPlainObject);
  return val;
}

const sdk = new LearnositySDK();
// `domain` is non-secret wiring baked from NODE_ENV — used only to exercise the
// signing path in the structural proof. The recipe tells the developer their
// signing domain must equal their own LMS serving host (the program's `domain`).
const domain = process.env.NODE_ENV === "production" ? "l0177.graffiticode.org" : "localhost";
const initAuthor = buildInitAuthor({ sdk, domain });

// The authoring-integration operations this oracle produces recipes for.
const OPERATIONS = new Set([
  "embed-editor", "save-item", "update-item", "fetch-item", "list-items", "tag-items",
]);
// Operations that embed the Author API editing UI (require a user + serving domain).
const AUTHOR_UI_OPERATIONS = new Set(["embed-editor"]);

// Learnosity widget types the Author API can enable (mirrors the default
// allow-list in author.ts). Used to validate a program's `widgets`.
const WIDGET_TYPES = new Set([
  "mcq", "shorttext", "longtext", "clozetext", "plaintext", "fillintheblanks",
  "association", "choicematrix", "classification", "clozeassociation",
  "clozedropdown", "clozeformula", "clozeinlinetext", "formula", "graphplotting",
  "highlighttext", "hotspot", "imageclozeassociation", "imageclozetext",
  "numberline", "orderlist", "sortlist", "tokenhighlight",
]);

// Resolve Learnosity credentials (same contract as L0176): program-supplied
// set-var "learnosity-key"/"learnosity-secret" override the api-injected
// defaults, and must be supplied together. The oracle only needs real
// credentials for the (deferred) live-auth proof; the v1 structural proof signs
// locally with a placeholder when none are present.
function resolveCredentials(options: any): any {
  const cfg = (options && options.config && options.config.learnosity) || {};
  const optKey = options["learnosity-key"];
  const optSecret = options["learnosity-secret"];
  const hasKey = typeof optKey === "string" && optKey !== "";
  const hasSecret = typeof optSecret === "string" && optSecret !== "";
  if (hasKey !== hasSecret) {
    return { error: `Error: set-var "learnosity-key" and "learnosity-secret" must both be set together.` };
  }
  if (hasKey && hasSecret) return { key: optKey, secret: optSecret, fromOptions: true };
  return { key: cfg.key, secret: cfg.secret, fromOptions: false };
}

export class Checker extends BaseChecker {
  [key: string]: any;

  INTEGRATION(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, _v0: any) => {
      resume(([] as any[]).concat(e0 || []), node);
    });
  }
}

export class Transformer extends BaseTransformer {
  [key: string]: any;

  INTEGRATION(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      const rec = toPlainObject(v0) || {};
      const errors: any[] = ([] as any[]).concat(e0 || []);
      const operation = rec.operation;

      if (!operation || !OPERATIONS.has(operation)) {
        errors.push(`Error: "operation" must be one of: ${[...OPERATIONS].join(", ")}.`);
      }
      let widgets = rec.widgets;
      if (widgets != null && !Array.isArray(widgets)) widgets = [widgets];
      if (Array.isArray(widgets)) {
        const bad = widgets.filter((w: any) => !WIDGET_TYPES.has(w));
        if (bad.length) {
          errors.push(`Error: unknown widget type(s): ${bad.join(", ")}. Allowed: ${[...WIDGET_TYPES].join(", ")}.`);
        }
      }
      if (operation && AUTHOR_UI_OPERATIONS.has(operation)) {
        if (!rec.domain) errors.push(`Error: operation "${operation}" requires "domain" (your LMS serving host — it must match the request's signing domain).`);
        if (!rec.user) errors.push(`Error: operation "${operation}" requires "user" (a stable end-user id).`);
      }
      if (errors.length > 0) { resume(errors, undefined); return; }

      // Structural proof: exercise local (HMAC-only, no network) construction +
      // signing of the request to prove it is well-formed.
      const creds = resolveCredentials(options);
      if (creds.error) { resume([creds.error], undefined); return; }
      const signKey = creds.key || "STRUCTURAL_CHECK_KEY";
      const signSecret = creds.secret || "STRUCTURAL_CHECK_SECRET";

      const proof: any = {
        verified: true,
        operation,
        domain: rec.domain,
        user: rec.user,
        widgets: Array.isArray(widgets) ? widgets : undefined,
        itembank: rec.itembank,
        reference: rec.reference,
        signedWithRealCredentials: !!creds.fromOptions,
      };

      try {
        if (AUTHOR_UI_OPERATIONS.has(operation)) {
          const signed = await initAuthor(
            {
              widgetTypes: Array.isArray(widgets) ? widgets : undefined,
              data: rec.reference ? { reference: rec.reference } : undefined,
            },
            { key: signKey, secret: signSecret },
          );
          proof.signed = !!signed;
        } else {
          // Data API operations (save/update/fetch/list/tag): v1 validates the
          // operation shape only; the live proof (a signed Data API round-trip)
          // is deferred. get_spec's recipe still covers the full procedure.
          proof.signed = false;
          proof.note = "structural validation only; live Data API proof deferred";
        }
        resume([], proof);
      } catch (e: any) {
        resume([`Error: structural proof failed to construct/sign the ${operation} request: ${String((e && e.message) || e)}`], undefined);
      }
    });
  }

  PROG(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      resume(e0, v0.pop());
    });
  }
}

export const compiler = new Compiler({
  langID: "0177",
  version: "v0.0.1",
  Checker,
  Transformer,
});
