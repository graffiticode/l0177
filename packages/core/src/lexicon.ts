// SPDX-License-Identifier: MIT
// L0177 lexicon — derived from vocab.ts (single source of truth). Function keywords
// are lowercase-kebab; enum TAG values are UPPERCASE-kebab (so they never collide).
//   - author-embed + members (item/widget/settings/filter-restricted/toolbar) : arity 1
//   - views + sections + every property                                       : arity 2
//   - widget-type enum values                                                  : TAG tokens
import { lexicon as base, mergeLexicon } from "@graffiticode/l0000";
import { ARITY1, VIEWS, SECTIONS, PROPERTIES, WIDGET_TAGS, TOK } from "./vocab.js";

const F = (name: string, arity: number) => ({ tk: 1, name, cls: "function", length: arity, arity });
const TAG = () => ({ tk: 22, name: "TAG", cls: "val", length: 0, arity: 0 });

const additions: Record<string, any> = {};
for (const k of ARITY1) additions[k] = F(TOK(k), 1);
for (const k of [...Object.keys(VIEWS), ...Object.keys(SECTIONS), ...PROPERTIES]) {
  additions[k] = F(TOK(k), 2);
}
for (const t of Object.keys(WIDGET_TAGS)) additions[t] = TAG();

// The merge is child-over-parent, so an L0177 keyword that reuses a base name would
// SHADOW it silently — the base function simply disappears from the dialect. That is
// how `filter` (L0000's `<lambda list: list>`) would have vanished had
// `config.item_list.filter` been modeled under its bare Learnosity name.
//
// L0177 overrides nothing: where a Learnosity leaf name would collide, the keyword
// mirrors more of its path instead — `filter.restricted` -> `filter-restricted`,
// `toolbar.add` -> `toolbar-add`. Passing no `overrides` is the assertion that this
// stays true as coverage grows; mergeLexicon throws on the next silent collision.
export const lexicon = mergeLexicon(base, additions, { langID: "L0177" });
