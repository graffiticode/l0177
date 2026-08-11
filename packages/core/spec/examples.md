<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Examples

Example natural-language requests for the Learnosity Author API integration oracle,
and the view each maps to. L0177 returns a recipe (via `get_spec`), not item content.

1. "How do I embed the Learnosity item editor for author u123 on lms.acme.edu, allowing only MCQ and cloze?" → `item-edit` with `question-type-groups [MCQ CLOZE]` (the enforced restriction)
2. "Let authors edit item algebra-item-1, but not delete widgets." → `item-edit`
3. "Embed the item editor restricted to short-text and formula question types." → `item-edit`
4. "Embed a Learnosity item browser so authors can find and open existing items." → `item-list`
5. "Embed the Learnosity activity editor so designers can assemble activities from our item bank." → `activity-edit`
6. "Show a browsable list of our Learnosity activities." → `activity-list`
