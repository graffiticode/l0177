<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Examples

Example natural-language requests for the Learnosity Author API integration oracle,
and the construct each maps to. L0177 returns a recipe (via `get_spec`), not item content.

1. "How do I embed the Learnosity item editor for author u123 on lms.acme.edu, allowing only MCQ and cloze?" → `author-item-edit`
2. "Embed the Learnosity item editor in read-only mode for a review workflow." → `author-item-edit` (`locked: true`)
3. "Let authors edit item algebra-item-1, but not delete widgets." → `author-item-edit` (`reference`, `delete_widgets: false`)
4. "Embed a Learnosity item browser so authors can find and open existing items." → `author-item-list`
5. "Embed the Learnosity activity editor so designers can assemble activities from our item bank." → `author-activity-edit`
6. "Show a browsable list of our Learnosity activities." → `author-activity-list`
