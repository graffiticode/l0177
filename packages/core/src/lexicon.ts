// SPDX-License-Identifier: MIT
// L0177 — Learnosity Author API integration oracle. Function-chain vocabulary:
// one `author-embed` head plus one FUNCTION PER ATTRIBUTE, so the compiler has a
// Checker/Transformer method per attribute and can validate each independently and
// give targeted, per-function feedback (the l0176 attribute pattern).
//
//   author-embed
//     mode "item-edit"
//     domain "lms.acme.edu"
//     user { id: "u123" }
//     allow-widgets ["mcq", "clozetext"]
//     item-permissions { edit_widgets: true, delete_widgets: false }
//     content { dynamic_content: true, shared_passage: true }
//     {}
import { lexicon as base } from "@graffiticode/l0000";

const additions = {
  // head (arity 1: takes the record assembled by the attribute chain)
  "author-embed": { tk: 1, name: "AUTHOR_EMBED", cls: "function", length: 1, arity: 1 },
  // attribute functions (arity 2: value + continuation)
  "mode": { tk: 1, name: "MODE", cls: "function", length: 2, arity: 2 },
  "domain": { tk: 1, name: "DOMAIN", cls: "function", length: 2, arity: 2 },
  "user": { tk: 1, name: "USER", cls: "function", length: 2, arity: 2 },
  "reference": { tk: 1, name: "REFERENCE", cls: "function", length: 2, arity: 2 },
  "allow-widgets": { tk: 1, name: "ALLOW_WIDGETS", cls: "function", length: 2, arity: 2 },
  "item-permissions": { tk: 1, name: "ITEM_PERMISSIONS", cls: "function", length: 2, arity: 2 },
  "content": { tk: 1, name: "CONTENT", cls: "function", length: 2, arity: 2 },
  "organisation-id": { tk: 1, name: "ORGANISATION_ID", cls: "function", length: 2, arity: 2 },
  "locked": { tk: 1, name: "LOCKED", cls: "function", length: 2, arity: 2 },
};

export const lexicon = { ...base, ...additions };
