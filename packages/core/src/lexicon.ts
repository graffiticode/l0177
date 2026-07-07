// SPDX-License-Identifier: MIT
// L0177 lexicon — derived from vocab.ts (single source of truth). Function keywords
// are lowercase-kebab; enum TAG values are UPPERCASE-kebab (so they never collide).
//   - author-embed + members (item/widget/settings) : arity 1
//   - views + sections + every property             : arity 2
//   - widget-type enum values                        : TAG tokens
import { lexicon as base } from "@graffiticode/l0000";
import { ARITY1, VIEWS, SECTION_FIELDS, PROPS, WIDGET_TAGS, TOK } from "./vocab.js";

const F = (name: string, arity: number) => ({ tk: 1, name, cls: "function", length: arity, arity });
const TAG = () => ({ tk: 22, name: "TAG", cls: "val", length: 0, arity: 0 });

const additions: Record<string, any> = {};
for (const k of ARITY1) additions[k] = F(TOK(k), 1);
for (const k of [...Object.keys(VIEWS), ...Object.keys(SECTION_FIELDS), ...Object.keys(PROPS)]) {
  additions[k] = F(TOK(k), 2);
}
for (const t of Object.keys(WIDGET_TAGS)) additions[t] = TAG();

export const lexicon = { ...base, ...additions };
