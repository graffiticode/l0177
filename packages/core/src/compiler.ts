// SPDX-License-Identifier: MIT
/* Copyright (c) 2023, ARTCOMPILER INC */
// L0177 — Learnosity Author API integration oracle.
//
// Function-chain vocabulary: one `author-embed` head plus one function per
// attribute (mode, domain, user, allow-widgets, item-permissions, content, …).
// Each attribute has its own Checker/Transformer method, so the compiler validates
// EACH function independently and emits targeted, per-function feedback. Attribute
// functions push value-level warnings; the `author-embed` head adds cross-field
// coherence + design-completeness (holes). All warnings surface as `data.warnings`
// (holes first — progressive disclosure). The developer-facing RECIPE (with
// verification steps) is produced by get_spec from the AST + instructions.md +
// spec-directive.md. Hard errors are rare.
import {
  Checker as BaseChecker,
  Transformer as BaseTransformer,
  Compiler,
} from "@graffiticode/l0000";

// Unwrap L0000's internal Record representation to plain JS (identical to L0176).
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

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim() !== "";

const MODES = ["item-edit", "item-list", "activity-edit", "activity-list"];
const EDIT_MODES = new Set(["item-edit", "activity-edit"]);
const WIDGET_TYPES = new Set([
  "mcq", "shorttext", "longtext", "plaintext", "clozetext", "clozeassociation",
  "clozedropdown", "clozeformula", "clozeinlinetext", "choicematrix", "classification",
  "orderlist", "sortlist", "formula", "graphplotting", "highlighttext", "hotspot",
  "tokenhighlight", "numberline", "association", "fillintheblanks",
  "imageclozeassociation", "imageclozetext",
]);
const PERMISSION_KEYS = new Set(["edit_widgets", "delete_widgets", "edit_tags", "show_tags"]);
const CONTENT_KEYS = new Set(["dynamic_content", "shared_passage"]);

// Per-attribute value warnings accumulate on `options` (per-compile mutable state,
// like l0176's SET_VAR side effects); the head reads them.
const pushWarn = (options: any, w: string) => { (options.__warnings ||= []).push(w); };

// Attribute registry: output field + a validator that normalizes the value and
// emits per-function warnings. This is the "compiler checks each function" seam.
interface Attr { field: string; validate: (v: any, options: any) => any }
const ATTRIBUTES: Record<string, Attr> = {
  MODE: {
    field: "mode",
    validate(v, options) {
      const s = typeof v === "string" ? v.trim() : v;
      if (!MODES.includes(s)) {
        pushWarn(options, `mode "${s}" isn't a Learnosity Author API view — use one of: ${MODES.map((m) => `"${m}"`).join(", ")}.`);
      }
      return s;
    },
  },
  DOMAIN: { field: "domain", validate: (v) => v },
  USER: {
    field: "user",
    validate(v, options) {
      const u = v && typeof v === "object" && !Array.isArray(v) ? v : null;
      if (!u || !isNonEmptyString(u.id)) {
        pushWarn(options, `user needs an \`id\` — the author's stable id (recorded in the item-bank audit trail).`);
      }
      return u ?? v;
    },
  },
  REFERENCE: { field: "reference", validate: (v) => v },
  ALLOW_WIDGETS: {
    field: "allow_widgets",
    validate(v, options) {
      const list = Array.isArray(v) ? v : v == null ? [] : [v];
      const bad = list.filter((w: any) => !WIDGET_TYPES.has(w));
      if (bad.length) {
        pushWarn(options, `these aren't Learnosity widget types: ${bad.join(", ")}. Use types like mcq, shorttext, clozetext, clozedropdown, choicematrix, orderlist, classification, formula, tokenhighlight.`);
      }
      return list;
    },
  },
  ITEM_PERMISSIONS: {
    field: "item_permissions",
    validate(v, options) {
      const rec = v && typeof v === "object" && !Array.isArray(v) ? v : {};
      for (const [k, val] of Object.entries(rec)) {
        if (!PERMISSION_KEYS.has(k)) pushWarn(options, `item-permissions: "${k}" isn't a known permission. Known: ${[...PERMISSION_KEYS].join(", ")}.`);
        else if (typeof val !== "boolean") pushWarn(options, `item-permissions.${k} must be true or false.`);
      }
      return rec;
    },
  },
  CONTENT: {
    field: "content",
    validate(v, options) {
      const rec = v && typeof v === "object" && !Array.isArray(v) ? v : {};
      for (const [k, val] of Object.entries(rec)) {
        if (!CONTENT_KEYS.has(k)) pushWarn(options, `content: "${k}" isn't a known content option. Known: ${[...CONTENT_KEYS].join(", ")}.`);
        else if (typeof val !== "boolean") pushWarn(options, `content.${k} must be true or false.`);
      }
      return rec;
    },
  },
  ORGANISATION_ID: {
    field: "organisation_id",
    validate(v, options) {
      if (v != null && typeof v !== "number") pushWarn(options, `organisation-id must be a number (the item bank id).`);
      return v;
    },
  },
  LOCKED: {
    field: "locked",
    validate(v, options) {
      if (v != null && typeof v !== "boolean") pushWarn(options, `locked must be true or false.`);
      return v;
    },
  },
};

// The head: assemble the record, then cross-field coherence + design holes.
function finalizeDesign(rec: any, options: any): any {
  rec = rec || {};
  const holes: string[] = [];
  const coherence: string[] = [];
  const specificity: string[] = [];

  const mode = rec.mode;
  const isEdit = EDIT_MODES.has(mode);

  // --- design holes (dominant, required properties) ---
  if (!isNonEmptyString(mode)) {
    holes.push(`Which authoring experience? \`mode\` is required — one of "item-edit", "item-list", "activity-edit", "activity-list".`);
  }
  if (!isNonEmptyString(rec.domain)) {
    holes.push(`Your design doesn't specify the serving domain (required — the Author API signature binds to it; a mismatch is the #1 cause of a 401). Provide the domain where your app serves the editor.`);
  }
  if (!rec.user || typeof rec.user !== "object" || !isNonEmptyString(rec.user.id)) {
    holes.push(`Your design doesn't identify the author (required). Provide a user with a stable id.`);
  }
  if (mode === "item-edit" && !isNonEmptyString(rec.reference)) {
    holes.push(`item-edit needs a reference — the existing item to edit, or a new reference to create.`);
  }

  // --- cross-field coherence ---
  if (mode && !isEdit) {
    const editOnly = ["allow_widgets", "item_permissions", "content"].filter((k) => rec[k] !== undefined);
    if (editOnly.length) {
      coherence.push(`${editOnly.map((k) => k.replace(/_/g, "-")).join(", ")} apply only to an editing experience, not the ${mode} view — they'll be ignored here.`);
    }
  }

  // --- specificity advisories (surface after holes clear) ---
  if (isEdit) {
    if (rec.allow_widgets === undefined) specificity.push(`Allowed widget types aren't restricted — the editor exposes all default types. Restrict them to the question types your authors should use.`);
    if (rec.item_permissions === undefined) specificity.push(`No editor permissions set (edit-widgets, delete-widgets, edit-tags, show-tags) — defaults apply. Set them to match your author roles.`);
  }
  if (rec.organisation_id === undefined) specificity.push(`No item bank specified (organisation-id) — the default is used.`);

  const attrWarnings: string[] = options.__warnings || [];
  const warnings = holes.length > 0 ? holes : [...attrWarnings, ...coherence, ...specificity];

  return {
    mode: isNonEmptyString(mode) ? mode : undefined,
    domain: isNonEmptyString(rec.domain) ? rec.domain : undefined,
    user: rec.user,
    reference: isNonEmptyString(rec.reference) ? rec.reference : undefined,
    allow_widgets: rec.allow_widgets,
    item_permissions: rec.item_permissions,
    content: rec.content,
    organisation_id: rec.organisation_id,
    locked: rec.locked,
    complete: holes.length === 0,
    warnings,
  };
}

class Checker extends BaseChecker {
  [key: string]: any;
  AUTHOR_EMBED(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any) => resume(([] as any[]).concat(e0 || []), node));
  }
}
// Generate a Checker method per attribute (visit value + continuation).
for (const name of Object.keys(ATTRIBUTES)) {
  Checker.prototype[name] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any) => {
      this.visit(node.elts[1], options, async (e1: any) => {
        resume(([] as any[]).concat(e0 || [], e1 || []), node);
      });
    });
  };
}

class Transformer extends BaseTransformer {
  [key: string]: any;
  AUTHOR_EMBED(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      const rec = toPlainObject(v0);
      resume(e0, finalizeDesign(rec, options));
    });
  }
  PROG(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => resume(e0, v0.pop()));
  }
}
// Generate a Transformer method per attribute: validate the value (per-function
// feedback), merge { field: value } into the continuation record.
for (const [name, attr] of Object.entries(ATTRIBUTES)) {
  Transformer.prototype[name] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        const value = attr.validate(toPlainObject(v0), options);
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, [attr.field]: value });
      });
    });
  };
}

export { Checker, Transformer };
export const compiler = new Compiler({
  langID: "0177",
  version: "v0.0.1",
  Checker,
  Transformer,
});
