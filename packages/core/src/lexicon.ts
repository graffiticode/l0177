// SPDX-License-Identifier: MIT
// L0177 — Learnosity Author API integration oracle. Its lexicon = L0000's base
// vocabulary + one head per Author API authoring experience (mode). Because the
// Author API UI has no built-in view switching, a developer builds a separate
// page/init per mode — so we model each as its own construct rather than one
// head + a `mode` field. Each construct takes a record literal describing the
// integration design; the record keys are ordinary keys validated by the
// compiler (see compiler.ts), not tokens.
import { lexicon as base } from "@graffiticode/l0000";

const additions = {
  "author-item-edit": { tk: 1, name: "AUTHOR_ITEM_EDIT", cls: "function", length: 1, arity: 1 },
  "author-item-list": { tk: 1, name: "AUTHOR_ITEM_LIST", cls: "function", length: 1, arity: 1 },
  "author-activity-edit": { tk: 1, name: "AUTHOR_ACTIVITY_EDIT", cls: "function", length: 1, arity: 1 },
  "author-activity-list": { tk: 1, name: "AUTHOR_ACTIVITY_LIST", cls: "function", length: 1, arity: 1 },
};

export const lexicon = { ...base, ...additions };
