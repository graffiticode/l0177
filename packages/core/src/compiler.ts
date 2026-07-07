// SPDX-License-Identifier: MIT
/* Copyright (c) 2023, ARTCOMPILER INC */
// L0177 — Learnosity Author API integration oracle.
//
// Uniform surface (derived from vocab.ts): every PROPERTY is an arity-2 kebab
// function that type-checks its value and merges it; members (item/widget/settings)
// are arity-1 (a property chain); views select the Learnosity mode and fold their
// [members]; sections (container/widget-templates/global) are arity-2 property
// sub-chains; widget-type enum values are UPPERCASE TAG tokens. Everything is
// optional (smart defaults). Each function validates its own argument (per-function
// feedback) and pushes non-fatal steering warnings; `author-embed` finalizes with
// design holes first (progressive disclosure). The recipe is produced by get_spec.
import {
  Checker as BaseChecker,
  Transformer as BaseTransformer,
  Compiler,
} from "@graffiticode/l0000";
import {
  ARITY1, VIEWS, VIEW_MEMBERS, VIEW_MODELED, SECTION_FIELDS, PROPS,
  MEMBER_FIELDS, TOPLEVEL_FIELDS, WIDGET_TAGS, TOK,
} from "./vocab.js";

function toPlainObject(val: any): any {
  if (val !== null && typeof val === "object" && val._type === "record" && val._entries instanceof Map) {
    const obj: any = {};
    for (const [k, v] of val._entries) obj[(k as string).replace(/^(tag|str|num):/, "")] = toPlainObject(v);
    return obj;
  }
  if (Array.isArray(val)) return val.map(toPlainObject);
  return val;
}
const isNonEmptyString = (v: any) => typeof v === "string" && v.trim() !== "";
const pushWarn = (options: any, w: string) => { (options.__warnings ||= []).push(w); };

// --- property value validation ---
function validateProp(name: string, type: string, value: any, options: any): any {
  if (type === "widgets") {
    const list = Array.isArray(value) ? value : value == null ? [] : [value];
    const mapped: string[] = [];
    for (const t of list) {
      const tag = t && typeof t === "object" && "tag" in t ? (t as any).tag : t; // base TAG -> { tag: "MCQ" }
      if (WIDGET_TAGS[tag]) mapped.push(WIDGET_TAGS[tag]);
      else pushWarn(options, `${name}: ${tag} isn't a Learnosity widget type — use tags like MCQ, SHORT-TEXT, CLOZE-TEXT, FORMULA, TOKEN-HIGHLIGHT.`);
    }
    return mapped;
  }
  if (type === "boolean" && typeof value !== "boolean") pushWarn(options, `${name} must be true or false.`);
  else if (type === "number" && typeof value !== "number") pushWarn(options, `${name} must be a number.`);
  else if (type === "string" && typeof value !== "string") pushWarn(options, `${name} must be a string.`);
  return value;
}

// --- author-embed finalize: top-level coherence + design holes (progressive disclosure) ---
const TOP_ALLOWED = new Set<string>([...TOPLEVEL_FIELDS, "mode", "config", ...Object.keys(SECTION_FIELDS)]);
function finalize(rec: any, options: any): any {
  const holes: string[] = [];
  const specificity: string[] = [];
  for (const k of Object.keys(rec)) {
    if (!TOP_ALLOWED.has(k)) pushWarn(options, `"${k}" isn't a top-level author-embed property.`);
  }
  const mode = rec.mode;
  if (!isNonEmptyString(mode)) holes.push("Which authoring view? Use exactly one of: item-edit, item-list, activity-edit, activity-list.");
  if (!isNonEmptyString(rec.domain)) holes.push("Your design doesn't specify the serving `domain` (required — the Author API signature binds to it, and a mismatch is the #1 cause of a 401). Provide the domain where your app serves the editor.");
  if (!isNonEmptyString(rec["user-id"])) holes.push("Your design doesn't identify the author (required). Provide `user-id` — the author's stable id.");
  if (mode === "item_edit" && !isNonEmptyString(rec.reference)) holes.push("item-edit needs a `reference` — the existing item to edit, or a new reference to create.");

  if (rec["allow-widgets"] === undefined && (mode === "item_edit" || mode === "activity_edit")) {
    specificity.push("`allow-widgets` not restricted — the editor exposes all default widget types. Restrict it to the types your authors should use.");
  }
  if (rec["organisation-id"] === undefined) {
    specificity.push("No item bank specified (`organisation-id`) — the default is used.");
  }

  const attrWarnings: string[] = options.__warnings || [];
  const warnings = holes.length > 0 ? holes : [...attrWarnings, ...specificity];
  return {
    mode: isNonEmptyString(mode) ? mode : undefined,
    domain: rec.domain,
    user: { id: rec["user-id"], email: rec["user-email"], firstname: rec["user-firstname"], lastname: rec["user-lastname"] },
    reference: rec.reference,
    organisation_id: rec["organisation-id"],
    allow_widgets: rec["allow-widgets"],
    config: rec.config,
    container: rec.container,
    widget_templates: rec["widget-templates"],
    global: rec.global,
    complete: holes.length === 0,
    warnings,
  };
}

// --- Checker: arity-aware, generated for every function token ---
const ARITIES: Record<string, number> = {};
for (const k of ARITY1) ARITIES[TOK(k)] = 1;
for (const k of [...Object.keys(VIEWS), ...Object.keys(SECTION_FIELDS), ...Object.keys(PROPS)]) ARITIES[TOK(k)] = 2;

class Checker extends BaseChecker { [key: string]: any; }
for (const [tok, arity] of Object.entries(ARITIES)) {
  Checker.prototype[tok] = arity === 1
    ? function (node: any, options: any, resume: any) {
      this.visit(node.elts[0], options, async (e0: any) => resume(([] as any[]).concat(e0 || []), node));
    }
    : function (node: any, options: any, resume: any) {
      this.visit(node.elts[0], options, async (e0: any) => {
        this.visit(node.elts[1], options, async (e1: any) => resume(([] as any[]).concat(e0 || [], e1 || []), node));
      });
    };
}

// --- Transformer ---
class Transformer extends BaseTransformer {
  [key: string]: any;
  PROG(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => resume(e0, v0.pop()));
  }
  AUTHOR_EMBED(node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => resume(e0, finalize(toPlainObject(v0) || {}, options)));
  }
}
// property functions (arity 2): type-check value, merge { name: value }
for (const [name, type] of Object.entries(PROPS)) {
  Transformer.prototype[TOK(name)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        const value = validateProp(name, type, toPlainObject(v0), options);
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, [name]: value });
      });
    });
  };
}
// members (arity 1): validate belonging, return { kind, value }
for (const [member, fields] of Object.entries(MEMBER_FIELDS)) {
  const allowed = new Set(fields);
  Transformer.prototype[TOK(member)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      const rec = toPlainObject(v0) || {};
      for (const k of Object.keys(rec)) if (!allowed.has(k)) pushWarn(options, `${member}: "${k}" isn't a valid ${member} property.`);
      resume(([] as any[]).concat(e0 || []), { kind: member, value: rec });
    });
  };
}
// sections (arity 2): validate belonging, merge { section: record }
for (const [section, fields] of Object.entries(SECTION_FIELDS)) {
  const allowed = new Set(fields);
  Transformer.prototype[TOK(section)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        const rec = toPlainObject(v0) || {};
        for (const k of Object.keys(rec)) if (!allowed.has(k)) pushWarn(options, `${section}: "${k}" isn't a valid ${section} option.`);
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, [section]: rec });
      });
    });
  };
}
// views (arity 2): fold [members] into config, select mode
for (const [view, mode] of Object.entries(VIEWS)) {
  const allowedMembers = new Set(VIEW_MEMBERS[view] || []);
  const modeled = VIEW_MODELED.has(view);
  Transformer.prototype[TOK(view)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        let members = toPlainObject(v0);
        if (!Array.isArray(members)) members = members == null ? [] : [members];
        const config: any = {};
        for (const m of members) {
          if (m && typeof m === "object" && m.kind) {
            if (allowedMembers.size && !allowedMembers.has(m.kind)) pushWarn(options, `${view}: "${m.kind}" isn't a valid member of this view.`);
            config[m.kind] = m.value;
          }
        }
        if (!modeled) pushWarn(options, `the ${mode} view isn't fully modeled yet — its members pass through with limited validation.`);
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, mode, config });
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
