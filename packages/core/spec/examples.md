<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Examples

Example natural-language requests for the Learnosity Authoring Integration oracle,
and the operation each maps to. L0177 returns a recipe (via `get_spec`), not item content.

1. "How do I embed the Learnosity item editor for user u123 on lms.acme.edu, allowing MCQ and cloze widgets?" → `embed-editor`
2. "Embed the Learnosity author UI restricted to short-text and formula question types." → `embed-editor`
3. "How do I save an authored item into my Learnosity item bank with my own key and secret?" → `save-item`
4. "Update the item bank item with reference artcompiler-item-42." → `update-item`
5. "Fetch the definition of item bank item artcompiler-item-42." → `fetch-item`
6. "List items in my item bank filtered by a Common Core standard tag." → `list-items`
7. "Tag these item bank items with CCSS.MATH.6.EE so the Author Site can filter them." → `tag-items`
