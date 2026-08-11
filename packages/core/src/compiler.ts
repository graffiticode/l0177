// SPDX-License-Identifier: MIT
/* Copyright (c) 2023, ARTCOMPILER INC */
// L0177 — Learnosity Author API integration oracle.
//
// Uniform surface (derived from vocab.ts): every PROPERTY is an arity-2 kebab
// function; members (item/widget/toolbar/…) are arity-1 (a property chain); views
// select the Learnosity mode and fold their [members]; sections (container/
// widget-templates/global) are arity-2 property sub-chains; widget-type enum values
// are UPPERCASE TAG tokens. Everything is optional (smart defaults).
//
// Property and member functions are deliberately DUMB — they collect, they do not
// validate. A property's legality and type depend on where it appears (`status` is
// a boolean under item_list.item but an array of strings under
// item_list.filter.restricted), and a property function cannot see its context.
// All validation therefore happens at the fold — the view, the section, or
// finalize — where (view, member) is known. Getting this backwards is what let
// item-edit's fields into item-list and emitted config paths Learnosity ignores.
//
// Each accepted field also records its exact Learnosity path in `paths`, so the
// recipe never has to infer one from a kebab name. `author-embed` finalizes with
// design holes first (progressive disclosure). The recipe is produced by get_spec.
import {
  Checker as BaseChecker,
  Transformer as BaseTransformer,
  Compiler,
} from "@graffiticode/l0000";
import {
  ARITY1, VIEWS, SECTIONS, TOPLEVEL, PROPERTIES, WIDGET_TAGS, TOK,
  type Fields,
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
const recordPath = (options: any, from: string, to: string) => { (options.__paths ||= {})[from] = to; };

// --- property value validation (called from the fold, which knows the type) ---
function validateProp(name: string, type: string, value: any, options: any, values?: string[]): any {
  const inRange = (v: any) => !values || values.includes(v);
  const rangeWarn = (v: any) =>
    pushWarn(options, `${name}: ${JSON.stringify(v)} isn't one of ${values!.map((s) => `"${s}"`).join(", ")}.`);
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
  if (type === "strings") {
    const list = Array.isArray(value) ? value : value == null ? [] : [value];
    if (!list.every((s) => typeof s === "string")) pushWarn(options, `${name} must be a list of strings.`);
    else for (const s of list) if (!inRange(s)) rangeWarn(s);
    return list;
  }
  if (type === "boolean" && typeof value !== "boolean") pushWarn(options, `${name} must be true or false.`);
  else if (type === "number" && typeof value !== "number") pushWarn(options, `${name} must be a number.`);
  else if (type === "string" && typeof value !== "string") pushWarn(options, `${name} must be a string.`);
  else if (type === "string" && !inRange(value)) rangeWarn(value);
  return value;
}

// Validate a collected property chain against the field set legal in THIS context.
// A field that doesn't belong is warned and DROPPED — keeping it would emit a
// config path Learnosity silently ignores (the API fails open), which is precisely
// the failure this dialect exists to prevent.
function validateFields(
  rec: any, fields: Fields, label: string, options: any, outBase: string, lrnBase: string,
): any {
  const out: any = {};
  for (const [k, v] of Object.entries(rec)) {
    const spec = fields[k];
    if (!spec) {
      const accepts = Object.keys(fields);
      pushWarn(options, `${label}: "${k}" isn't a valid ${label} property here. ` +
        (accepts.length ? `Accepts: ${accepts.join(", ")}.` : "It accepts no properties."));
      continue;
    }
    const [path, type, values] = spec;
    out[k] = validateProp(k, type, v, options, values);
    recordPath(options, `${outBase}.${k}`, `${lrnBase}.${path}`);
  }
  return out;
}

// --- author-embed finalize: top-level coherence + design holes ---
const TOP_ALLOWED = new Set<string>([
  ...Object.keys(TOPLEVEL), "mode", "config", "paths", ...Object.keys(SECTIONS),
]);
function finalize(rec: any, options: any): any {
  const holes: string[] = [];
  const specificity: string[] = [];
  const top: any = {};
  for (const [k, v] of Object.entries(rec)) {
    if (!TOP_ALLOWED.has(k)) { pushWarn(options, `"${k}" isn't a top-level author-embed property.`); continue; }
    // Top-level property types are checked here, for the same reason member fields
    // are checked at the view fold: this is the first point that knows the context.
    top[k] = TOPLEVEL[k] ? validateProp(k, TOPLEVEL[k][1], v, options) : v;
  }

  const mode = top.mode;
  if (!isNonEmptyString(mode)) holes.push("Which authoring view? Use exactly one of: item-edit, item-list, activity-edit, activity-list.");
  if (!isNonEmptyString(top.domain)) holes.push("Your design doesn't specify the serving `domain` (required — the Author API signature binds to it, and a mismatch is the #1 cause of a 401). Provide the domain where your app serves the editor.");
  if (!isNonEmptyString(top["user-id"])) holes.push("Your design doesn't identify the author (required). Provide `user-id` — the author's stable id.");
  if (mode === "item_edit" && !isNonEmptyString(top.reference)) holes.push("item-edit needs a `reference` — the existing item to edit, or a new reference to create.");

  if (top["allow-widgets"] === undefined && (mode === "item_edit" || mode === "activity_edit")) {
    specificity.push("`allow-widgets` not restricted — the editor exposes all default widget types. Restrict it to the types your authors should use.");
  }
  if (top["organisation-id"] === undefined) {
    specificity.push("No item bank specified (`organisation-id`) — the default is used.");
  }

  // Holes lead (progressive disclosure), and specificity nudges wait until they're filled —
  // but validity warnings always surface: they report input we rejected or dropped.
  const attrWarnings: string[] = options.__warnings || [];
  const warnings = holes.length > 0 ? [...holes, ...attrWarnings] : [...attrWarnings, ...specificity];
  return {
    mode: isNonEmptyString(mode) ? mode : undefined,
    domain: top.domain,
    user: { id: top["user-id"], email: top["user-email"], firstname: top["user-firstname"], lastname: top["user-lastname"] },
    reference: top.reference,
    organisation_id: top["organisation-id"],
    allow_widgets: top["allow-widgets"],
    config: top.config,
    container: top.container,
    widget_templates: top["widget-templates"],
    global: top.global,
    // Every config key this design sets, mapped to its exact Learnosity path, so the
    // recipe names paths rather than inferring them from kebab names.
    paths: options.__paths || {},
    complete: holes.length === 0,
    warnings,
  };
}

// --- Checker: arity-aware, generated for every function token ---
const ARITIES: Record<string, number> = {};
for (const k of ARITY1) ARITIES[TOK(k)] = 1;
for (const k of [...Object.keys(VIEWS), ...Object.keys(SECTIONS), ...PROPERTIES]) ARITIES[TOK(k)] = 2;

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

// property functions (arity 2): merge { name: value }. No validation — the fold does
// it, because only the fold knows which context this property landed in.
for (const name of PROPERTIES) {
  Transformer.prototype[TOK(name)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, [name]: toPlainObject(v0) });
      });
    });
  };
}

// members (arity 1): collect only. The view validates, since the same member name
// (`item`) denotes different Learnosity nodes with different fields per view.
for (const member of [...new Set(Object.values(VIEWS).flatMap((v) => Object.keys(v.members)))]) {
  Transformer.prototype[TOK(member)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      resume(([] as any[]).concat(e0 || []), { kind: member, value: toPlainObject(v0) || {} });
    });
  };
}

// sections (arity 2): the section IS the context, so it validates here.
for (const [section, spec] of Object.entries(SECTIONS)) {
  Transformer.prototype[TOK(section)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        const rec = validateFields(
          toPlainObject(v0) || {}, spec.fields, section, options,
          section, `config.${spec.path}`,
        );
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, [section]: rec });
      });
    });
  };
}

// views (arity 2): fold [members] into config, select mode, validate in context.
for (const [view, spec] of Object.entries(VIEWS)) {
  Transformer.prototype[TOK(view)] = function (node: any, options: any, resume: any) {
    this.visit(node.elts[0], options, async (e0: any, v0: any) => {
      this.visit(node.elts[1], options, async (e1: any, v1: any) => {
        let elements = toPlainObject(v0);
        if (!Array.isArray(elements)) elements = elements == null ? [] : [elements];
        const config: any = {};
        for (const el of elements) {
          if (!el || typeof el !== "object") continue;
          if (el.kind) {
            const member = spec.members[el.kind];
            if (!member) {
              // A member the view doesn't accept is dropped, not passed through: folding it in
              // would emit config Learnosity ignores for this mode (e.g. widget in item_list).
              pushWarn(options, `${view}: "${el.kind}" isn't a member of this view — dropped. ${view} accepts: ${Object.keys(spec.members).join(", ")}.`);
              continue;
            }
            config[el.kind] = validateFields(el.value, member.fields, el.kind, options,
              `config.${el.kind}`, `config.${spec.mode}.${member.path}`);
          } else {
            // A bare property chain (not a member) sets the view's own scalars,
            // e.g. `limit 25 {}` -> config.item_list.limit.
            Object.assign(config, validateFields(el, spec.view, view, options, "config", `config.${spec.mode}`));
          }
        }
        const cont = toPlainObject(v1) || {};
        resume(([] as any[]).concat(e0 || [], e1 || []), { ...cont, mode: spec.mode, config });
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
