// SPDX-License-Identifier: MIT
// L0177 — Learnosity Authoring Integration oracle. Its lexicon = L0000's base
// vocabulary + a single head keyword. Unlike L0176 (which authors item content
// and needs a large vocabulary), L0177 models ONE authoring-integration
// operation whose parameters are a plain L0000 record literal — so the only
// addition is the `integration` head. The record keys (operation, user, domain,
// widgets, itembank, reference, tags) are ordinary record keys, not tokens.
import { lexicon as base } from "@graffiticode/l0000";

const additions = {
  integration: { tk: 1, name: "INTEGRATION", cls: "function", length: 1, arity: 1 },
};

export const lexicon = { ...base, ...additions };
