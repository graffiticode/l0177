// SPDX-License-Identifier: MIT
/* Copyright (c) 2023, ARTCOMPILER INC */
// L0177 — Learnosity Author API integration oracle.
//
// The client (an agent) describes an *integration design* — which authoring
// experience it wants to embed and how it's configured. Each Author API mode is
// its own construct (`author-item-edit`, `author-item-list`,
// `author-activity-edit`, `author-activity-list`) taking a record literal whose
// keys mirror Learnosity's own naming (underscores).
//
// The compiler is a SEMANTIC VALIDATOR + design-completeness scorer. It does not
// sign or call Learnosity. It validates the design (do the values make sense? does
// the configuration make sense?) and emits `data.warnings` — non-fatal, imperative,
// specific steering hints, holes-first (progressive disclosure). The developer-facing
// RECIPE (with verification steps) is produced by get_spec from the AST +
// instructions.md + spec-directive.md. Hard errors are rare: only genuinely
// incoherent, generator-fixable structure.
import {
  Checker as BaseChecker,
  Transformer as BaseTransformer,
  Compiler,
} from "@graffiticode/l0000";

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

// The Learnosity widget types the Author API can enable (l0176 author.ts + docs).
const WIDGET_TYPES = new Set([
  "mcq", "shorttext", "longtext", "plaintext", "clozetext", "clozeassociation",
  "clozedropdown", "clozeformula", "clozeinlinetext", "choicematrix", "classification",
  "orderlist", "sortlist", "formula", "graphplotting", "highlighttext", "hotspot",
  "tokenhighlight", "numberline", "association", "fillintheblanks",
  "imageclozeassociation", "imageclozetext",
]);

// Boolean item-editor toggles (map into config.item_edit.item / .widget).
const EDIT_TOGGLES = [
  "edit_widgets", "delete_widgets", "edit_tags", "show_tags",
  "dynamic_content", "shared_passage",
];

// Per-construct design spec: the target Author API mode, whether a `reference`
// is a required design property, and whether item-editor config applies.
interface Spec { mode: string; requiresReference: boolean; editConfig: boolean }
const SPECS: Record<string, Spec> = {
  AUTHOR_ITEM_EDIT: { mode: "item_edit", requiresReference: true, editConfig: true },
  AUTHOR_ITEM_LIST: { mode: "item_list", requiresReference: false, editConfig: false },
  AUTHOR_ACTIVITY_EDIT: { mode: "activity_edit", requiresReference: false, editConfig: true },
  AUTHOR_ACTIVITY_LIST: { mode: "activity_list", requiresReference: false, editConfig: false },
};

const isNonEmptyString = (v: any) => typeof v === "string" && v.trim() !== "";
const kebab = (s: string) => s.toLowerCase().replace(/_/g, "-");

// Validate an authoring-integration design. Returns the normalized echo plus
// warnings. Design holes (missing required properties) are dominant and suppress
// specificity advisories (progressive disclosure): the client fills the holes
// first, then the sharper advisories surface. Hard errors only for structurally
// incoherent input the generator can fix from what it already has.
function validateDesign(specName: string, rec: any): { data: any; errors: string[] } {
  const spec = SPECS[specName];
  const construct = kebab(specName);
  const errors: string[] = [];
  const holes: string[] = [];
  const advisories: string[] = [];

  if (rec == null || typeof rec !== "object" || Array.isArray(rec)) {
    return { data: null, errors: [`Error: ${construct} takes a record describing the integration design, e.g. { domain: "…", user: { id: "…" } }.`] };
  }

  // --- design holes (dominant; required properties) ---
  if (!isNonEmptyString(rec.domain)) {
    holes.push(`Your design doesn't specify the serving domain (required — the Author API signature binds to it, and a mismatch is the #1 cause of a 401). Provide the domain where your app serves the editor (e.g. "lms.acme.edu").`);
  }
  const user = rec.user;
  if (user == null || typeof user !== "object" || Array.isArray(user) || !isNonEmptyString(user.id)) {
    holes.push(`Your design doesn't identify the author (required — Author API records the author in the item-bank audit trail). Provide a stable user id (e.g. your LMS user id).`);
  }
  if (spec.requiresReference && !isNonEmptyString(rec.reference)) {
    holes.push(`This is an item-editing experience but names no item — provide a reference (the existing item to edit, or a new reference to create).`);
  }

  // --- value checks (warn, don't hard-error: keep errors rare) ---
  let widgets = rec.allow_widgets;
  if (widgets != null && !Array.isArray(widgets)) widgets = [widgets];
  if (Array.isArray(widgets)) {
    const bad = widgets.filter((w: any) => !WIDGET_TYPES.has(w));
    if (bad.length) {
      advisories.push(`These aren't Learnosity widget types: ${bad.join(", ")}. Use types like mcq, shorttext, clozetext, clozedropdown, choicematrix, orderlist, classification, formula, tokenhighlight (or remove them).`);
    }
  }

  // --- cross-field coherence ---
  if (!spec.editConfig) {
    const misplaced = [...EDIT_TOGGLES, "allow_widgets"].filter((k) => rec[k] !== undefined).map(kebab);
    if (misplaced.length) {
      advisories.push(`${misplaced.join(", ")} apply only to an editing experience, not the ${spec.mode} view — they'll be ignored here. Remove them, or switch to author-item-edit.`);
    }
  }

  // --- specificity advisories (surface after holes are cleared) ---
  if (spec.editConfig) {
    if (widgets == null) {
      advisories.push(`Allowed widget types aren't restricted — the editor exposes all default types. Restrict them to the question types your authors should use for a tighter, safer editing experience.`);
    }
    if (EDIT_TOGGLES.every((k) => rec[k] === undefined)) {
      advisories.push(`No editor permissions set (edit-widgets, delete-widgets, edit-tags, show-tags, dynamic-content, shared-passage) — defaults apply. Set them to match your author roles.`);
    }
  }
  if (rec.organisation_id === undefined) {
    advisories.push(`No item bank specified (organisation-id) — the default is used. Set it if your authors work against a specific item bank.`);
  }

  // Progressive disclosure: holes first; advisories only once no holes remain.
  const warnings = holes.length > 0 ? holes : advisories;

  const data: any = {
    mode: spec.mode,
    domain: isNonEmptyString(rec.domain) ? rec.domain : undefined,
    user: user && typeof user === "object" && !Array.isArray(user) ? user : undefined,
    reference: isNonEmptyString(rec.reference) ? rec.reference : undefined,
    allow_widgets: Array.isArray(widgets) ? widgets : undefined,
    organisation_id: rec.organisation_id,
    complete: holes.length === 0,
    warnings,
  };
  return { data, errors };
}

class Checker extends BaseChecker {
  [key: string]: any;
}
for (const name of Object.keys(SPECS)) {
  Checker.prototype[name] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, _v0: any) => {
      resume(([] as any[]).concat(e0 || []), node);
    });
  };
}

class Transformer extends BaseTransformer {
  [key: string]: any;
  PROG(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      resume(e0, v0.pop());
    });
  }
}
for (const name of Object.keys(SPECS)) {
  Transformer.prototype[name] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      const rec = toPlainObject(v0);
      const { data, errors } = validateDesign(name, rec);
      const err = ([] as any[]).concat(e0 || [], errors);
      if (err.length > 0) { resume(err, undefined); return; }
      resume([], data);
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
