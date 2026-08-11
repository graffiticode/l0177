<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Examples

Natural-language requests that exercise the Learnosity **Author API integration** oracle. Run these
through the generator to produce examples organically; the programs they yield are the corpus.

They are phrased the way a client actually asks — an integration to embed and how it should behave —
not as descriptions of the vocabulary. Between them they should reach every part of the surface:
all four views, the enforced question-picker restriction, editor and widget permissions, the
metadata pane, list filters and toolbars, assessment-player settings, content tags, item banks,
container and global options, and designs that arrive with holes still in them.

L0177 returns a developer recipe (via `get_spec`), not item content and not runnable code.

## Item editor — `item-edit`

1. "How do I embed the Learnosity item editor for author u123 on lms.acme.edu, allowing only multiple-choice and cloze questions?"
2. "Let authors edit item algebra-item-1, but not delete widgets."
3. "Embed the item editor so authors can only add written and spoken response questions."
4. "Put the item editor in our LMS restricted to maths and graphing question types, in a 640-pixel-tall pane."
5. "Authors should see an item's title and reference, and new items should get references prefixed ALG_."
6. "Make the item title mandatory before an item can be saved."
7. "Show difficulty and notes on the item and let authors edit them, but make the source read-only."
8. "Authors should be able to see an item's tags but not change them."
9. "Open the item editor in preview mode by default and hide the edit/preview toggle."
10. "Let authors duplicate an item, including its shared passages."
11. "Stamp every new item with Subject: Biology and Grade: 9."
12. "Stop authors saving any item still tagged Status: locked."
13. "Let authors work in the editor but don't persist anything when they hit save."
14. "Turn off the item editor's save button entirely — our own app handles saving."
15. "Enable audio recording and dynamic content on items in our editor."
16. "Embed the item editor for author j.chen@acme.edu (Jamie Chen) on authoring.acme.edu, item bank 4021."

## Item browser — `item-list`

17. "Embed a Learnosity item browser so authors can find and open existing items."
18. "Show authors a list of only their own published items, 25 per page."
19. "The item list should show titles and references, and let authors select several items at once."
20. "Give the item browser a search box and a create button, but only let people search by reference and title."
21. "Each row in the item list should link to our own editor page at /items/:reference/edit."
22. "Only show items tagged Subject: Math in the browser."
23. "Hide the create button in the item browser — our authors shouldn't be making new items there."

## Activity editor — `activity-edit`

24. "Embed the Learnosity activity editor so instructional designers can assemble activities from our item bank."
25. "Let designers build unit-3-quiz: search our bank, add items, and edit them in place."
26. "In the activity editor, show the player settings and let designers set a time limit and turn on auto-save."
27. "Designers should be able to shuffle items and show distractor rationales in the assessment player."
28. "Let designers control whether the exit, extend and save buttons appear in the player's administration menu."
29. "The activity editor should search both our core item bank and our licensed content bank."
30. "Limit activity item search to 25 results and only show items created by the current user."
31. "Show the activity's title, description and difficulty in the editor, but don't let designers change the difficulty."
32. "Let designers add items to an activity but not edit them."
33. "Turn on custom points per item in the activity editor."

## Activity browser — `activity-list`

34. "Show a browsable list of our Learnosity activities."
35. "List activities with titles, references and status, 15 per page."
36. "Let designers create adaptive and branching activities from the activity list."
37. "Only show published and unpublished activities in the list, not archived ones."

## Layout, chrome and global behaviour

38. "Fit the item editor into a 700-pixel pane with a 60-pixel fixed footer."
39. "Give the widget editor back and save buttons, and require validation before saving a question."
40. "Stop the browser asking authors to confirm before navigating away from the editor."

## Under-specified requests (the compiler should flag the holes)

41. "I want to embed the Learnosity item editor."
42. "Embed an item browser for our authors."
43. "Set up the activity editor so our team can build quizzes, restricted to multiple choice."
44. "Embed the Learnosity item editor on lms.acme.edu."

## Out of scope (should be redirected, not designed)

45. "Write me a multiple-choice question about photosynthesis with four options." *(item content → L0176)*
46. "Give me the Node.js code to embed the item editor." *(the recipe is language-neutral; it describes the procedure, it doesn't emit code)*
