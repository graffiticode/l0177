// SPDX-License-Identifier: MIT
// L0177 vocabulary — single source of truth for the lexicon and the compiler.
//
// Every PROPERTY is a kebab-case arity-2 function (value + continuation); chains
// terminate with `{}`. Learnosity's nested objects are flattened to kebab names
// (e.g. config.item_edit.item.reference.show -> `reference-show`). Members
// (`item`/`widget`/`settings`) are arity-1 (a property chain). Views and sections
// are arity-2. Everything is optional — smart defaults keep programs short.

// gc token / dispatch tag = UPPER_SNAKE of the kebab keyword.
export const TOK = (kw: string) => kw.toUpperCase().replace(/-/g, "_");

// arity-1: the head + the view members.
export const ARITY1 = ["author-embed", "item", "widget", "settings"];

// Views (arity-2, [members]) — exactly one per program selects the Learnosity mode.
export const VIEWS: Record<string, string> = {
  "item-edit": "item_edit",
  "item-list": "item_list",
  "activity-edit": "activity_edit",
  "activity-list": "activity_list",
};
// Which member kinds each view accepts (unmodeled views validate loosely).
export const VIEW_MEMBERS: Record<string, string[]> = {
  "item-edit": ["item", "widget", "settings"],
  "item-list": ["item", "filter", "toolbar"],
  "activity-edit": [],
  "activity-list": ["filter", "title", "toolbar"],
};
export const VIEW_MODELED = new Set(["item-edit"]);

// Sections (arity-2, a property sub-chain) at the top level.
export const SECTION_FIELDS: Record<string, string[]> = {
  "container": ["height", "fixed-footer-height", "scroll-into-view-selector"],
  "widget-templates": ["back", "save", "require-validation"],
  "global": ["disable-onbeforeunload"],
};

// Property functions (arity-2) -> value type. Type is one of:
// "boolean" | "number" | "string" | "widgets".
export const PROPS: Record<string, string> = {
  // top-level (author-embed chain)
  "domain": "string",
  "user-id": "string", "user-email": "string", "user-firstname": "string", "user-lastname": "string",
  "reference": "string", "organisation-id": "number", "allow-widgets": "widgets",
  // item (config.item_edit.item)
  "answers": "boolean", "back": "boolean", "columns": "boolean", "dynamic-content": "boolean",
  "dynamic-image-tag": "boolean", "enable-audio-recording": "boolean", "scoring": "boolean",
  "shared-passage": "boolean", "status": "boolean", "tabs": "boolean",
  "reference-show": "boolean", "reference-edit": "boolean", "reference-prefix": "string",
  "tags-show": "boolean", "tags-edit": "boolean",
  // widget (config.item_edit.widget)
  "edit": "boolean", "delete": "boolean",
  // settings (config.item_edit.settings)
  "show": "boolean", "full-height": "boolean",
  // widget-templates
  "require-validation": "boolean",
  // container
  "height": "number", "fixed-footer-height": "number", "scroll-into-view-selector": "string",
  // global
  "disable-onbeforeunload": "boolean",
  // shared boolean leaves used by sections too (back/save also appear in widget-templates)
  "save": "boolean",
};

// Which properties each member accepts (kebab).
export const MEMBER_FIELDS: Record<string, string[]> = {
  "item": [
    "answers", "back", "columns", "dynamic-content", "dynamic-image-tag", "enable-audio-recording",
    "scoring", "shared-passage", "status", "tabs",
    "reference-show", "reference-edit", "reference-prefix", "tags-show", "tags-edit",
  ],
  "widget": ["edit", "delete"],
  "settings": ["show", "full-height"],
};

// Top-level (author-embed) accepted property keys (besides views/sections).
export const TOPLEVEL_FIELDS = [
  "domain", "user-id", "user-email", "user-firstname", "user-lastname",
  "reference", "organisation-id", "allow-widgets",
];

// Enum values are UPPERCASE-kebab TAG tokens (never collide with lowercase-kebab
// functions). Widget-type tags map to Learnosity's widget-type strings.
export const WIDGET_TAGS: Record<string, string> = {
  "MCQ": "mcq", "SHORT-TEXT": "shorttext", "LONG-TEXT": "longtext", "PLAIN-TEXT": "plaintext",
  "CLOZE-TEXT": "clozetext", "CLOZE-ASSOCIATION": "clozeassociation", "CLOZE-DROPDOWN": "clozedropdown",
  "CLOZE-FORMULA": "clozeformula", "CLOZE-INLINE-TEXT": "clozeinlinetext", "CHOICE-MATRIX": "choicematrix",
  "CLASSIFICATION": "classification", "ORDER-LIST": "orderlist", "SORT-LIST": "sortlist", "FORMULA": "formula",
  "GRAPH-PLOTTING": "graphplotting", "HIGHLIGHT-TEXT": "highlighttext", "HOTSPOT": "hotspot",
  "TOKEN-HIGHLIGHT": "tokenhighlight", "NUMBER-LINE": "numberline", "ASSOCIATION": "association",
  "FILL-IN-THE-BLANKS": "fillintheblanks", "IMAGE-CLOZE-ASSOCIATION": "imageclozeassociation",
  "IMAGE-CLOZE-TEXT": "imageclozetext",
};
