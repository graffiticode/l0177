// SPDX-License-Identifier: MIT
// L0177 vocabulary — single source of truth for the lexicon and the compiler.
//
// Every PROPERTY is a kebab-case arity-2 function (value + continuation); chains
// terminate with `{}`. Members (`item`/`widget`/…) are arity-1 (a property chain).
// Views and sections are arity-2. Everything is optional — smart defaults keep
// programs short.
//
// A property's meaning depends on WHERE it appears: `status` is a boolean under
// `config.item_list.item` but an array of strings under
// `config.item_list.filter.restricted`. So the registry is keyed by view and then
// by member, and each field carries BOTH its Learnosity path and its type. The
// compiler resolves membership and type at the view fold, where that context is
// known — never in the property or member function, which cannot see it.
//
// Field entries are [learnosityPath, type]. The path is relative to its member
// (or section), and is recorded because the kebab name alone is ambiguous about
// its separator: `title-show` is `title.show` but `enable-selection` is
// `enable_selection`. The recipe must name exact paths, so it is never left to
// infer them.

// gc token / dispatch tag = UPPER_SNAKE of the kebab keyword.
export const TOK = (kw: string) => kw.toUpperCase().replace(/-/g, "_");

// Value types a field may declare.
//   boolean | number | string | strings (array of strings) | widgets (tag list)
export type Field = [string, string];
export type Fields = Record<string, Field>;
export type Member = { path: string; fields: Fields };
export type View = {
  mode: string;
  modeled: boolean;
  view: Fields; // view-level scalars (config.<mode>.<field>)
  members: Record<string, Member>;
};

// The head. Members are derived from the registry below.
export const HEAD = "author-embed";

// Views (arity-2, [members]) — exactly one per program selects the Learnosity mode.
// An unmodeled view accepts any member and validates nothing, with a warning.
export const VIEWS: Record<string, View> = {
  "item-edit": {
    mode: "item_edit",
    modeled: true,
    view: {},
    members: {
      item: {
        path: "item",
        fields: {
          "answers": ["answers", "boolean"],
          "back": ["back", "boolean"],
          "columns": ["columns", "boolean"],
          "dynamic-content": ["dynamic_content", "boolean"],
          "dynamic-image-tag": ["dynamic_image_tag", "boolean"],
          "enable-audio-recording": ["enable_audio_recording", "boolean"],
          "scoring": ["scoring", "boolean"],
          "shared-passage": ["shared_passage", "boolean"],
          "status": ["status", "boolean"],
          "tabs": ["tabs", "boolean"],
          "reference-show": ["reference.show", "boolean"],
          "reference-edit": ["reference.edit", "boolean"],
          "reference-prefix": ["reference.prefix", "string"],
          "tags-show": ["tags.show", "boolean"],
          "tags-edit": ["tags.edit", "boolean"],
        },
      },
      widget: {
        path: "widget",
        fields: {
          "edit": ["edit", "boolean"],
          "delete": ["delete", "boolean"],
        },
      },
      settings: {
        path: "settings",
        fields: {
          "show": ["show", "boolean"],
          "full-height": ["full_height", "boolean"],
        },
      },
    },
  },

  "item-list": {
    mode: "item_list",
    modeled: true,
    view: {
      "limit": ["limit", "number"],
    },
    members: {
      // NOTE: config.item_list.item is a DIFFERENT node from config.item_edit.item.
      // They share exactly one field name (`status`). Attaching item-edit's fields
      // here is the bug this registry shape exists to make impossible.
      item: {
        path: "item",
        fields: {
          "url": ["url", "string"],
          "enable-selection": ["enable_selection", "boolean"],
          "status": ["status", "boolean"],
          "title-show": ["title.show", "boolean"],
          "title-show-reference": ["title.show_reference", "boolean"],
        },
      },
      // `filter-restricted`, not `filter`: a bare `filter` would shadow L0000's
      // list `filter`. The name mirrors more of the Learnosity path instead of
      // inventing a term. Every documented leaf under `filter` is under
      // `.restricted`, so nothing is lost.
      "filter-restricted": {
        path: "filter.restricted",
        fields: {
          "current-user": ["current_user", "boolean"],
          "created-by": ["created_by", "strings"],
          "status": ["status", "strings"],
          "allow-filtered-tags-overwrite": ["tags.allow_filtered_tags_overwrite", "boolean"],
        },
      },
      toolbar: {
        path: "toolbar",
        fields: {
          // `toolbar-add`, not `add`: a bare `add` would shadow L0000's arithmetic
          // `add`. Same mirroring rule as `filter-restricted`.
          "toolbar-add": ["add", "boolean"],
          "search-show": ["search.show", "boolean"],
          "search-status": ["search.status", "boolean"],
          "search-tags-show": ["search.tags.show", "boolean"],
          "search-widget-type": ["search.widget_type", "boolean"],
          "search-controls": ["search.controls", "strings"],
        },
      },
    },
  },

  "activity-edit": { mode: "activity_edit", modeled: false, view: {}, members: {} },
  "activity-list": { mode: "activity_list", modeled: false, view: {}, members: {} },
};

// Sections (arity-2, a property sub-chain) at the top level of author-embed.
export const SECTIONS: Record<string, Member> = {
  "container": {
    path: "container",
    fields: {
      "height": ["height", "number"],
      "fixed-footer-height": ["fixed_footer_height", "number"],
      "scroll-into-view-selector": ["scroll_into_view_selector", "string"],
    },
  },
  "widget-templates": {
    path: "widget_templates",
    fields: {
      "back": ["back", "boolean"],
      "save": ["save", "boolean"],
      "require-validation": ["require_validation", "boolean"],
    },
  },
  "global": {
    path: "global",
    fields: {
      "disable-onbeforeunload": ["disable_onbeforeunload", "boolean"],
    },
  },
};

// Top-level properties in the author-embed chain -> [request path, type].
// `allow-widgets` has NO confirmed Learnosity binding (the documented widget-type
// restriction path was tested against the live API and restricts nothing), so its
// path is null: the recipe must carry it as intent plus a verification step, never
// as a config key. See spec/instructions.md.
export const TOPLEVEL: Record<string, [string | null, string]> = {
  "domain": ["domain", "string"],
  "user-id": ["user.id", "string"],
  "user-email": ["user.email", "string"],
  "user-firstname": ["user.firstname", "string"],
  "user-lastname": ["user.lastname", "string"],
  "reference": ["reference", "string"],
  "organisation-id": ["organisation_id", "number"],
  "allow-widgets": [null, "widgets"],
};

// --- derived: everything the lexicon and compiler need ---

// Member keywords across all views (arity-1, alongside the head).
export const MEMBERS: string[] = [
  ...new Set(Object.values(VIEWS).flatMap((v) => Object.keys(v.members))),
];
export const ARITY1: string[] = [HEAD, ...MEMBERS];

// Every property keyword (arity-2), from every context it can appear in.
export const PROPERTIES: string[] = [
  ...new Set([
    ...Object.keys(TOPLEVEL),
    ...Object.values(SECTIONS).flatMap((s) => Object.keys(s.fields)),
    ...Object.values(VIEWS).flatMap((v) => [
      ...Object.keys(v.view),
      ...Object.values(v.members).flatMap((m) => Object.keys(m.fields)),
    ]),
  ]),
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
