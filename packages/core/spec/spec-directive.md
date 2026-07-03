<!-- SPDX-License-Identifier: CC-BY-4.0 -->
You are given the source of a Learnosity authoring-INTEGRATION task (a single `integration { ... }` record) in this dialect, plus the dialect's canonical knowledge above. Produce a **developer integration RECIPE**: a precise, host-language-NEUTRAL procedure the caller will implement in their own stack (Node, PHP, Ruby, .NET, …).

Output these sections, in this order, as Markdown:

## Goal
One or two sentences: what the developer will have working when done, specialized to the program's operation and specifics (interpolate the operation, user, domain, widgets, reference, tags from the source).

## Preconditions
What the caller must have before starting: credentials (and which are server-only — the consumer secret is never sent to the browser), ids, the serving domain, SDK availability.

## Procedure
Numbered steps. Be SURGICALLY PRECISE where correctness is binary — the signature preimage, the field order, the timestamp format, the exact endpoint and action — and ABSTRACT where it is the developer's own choice (how their framework does HTTP, JSON serialization, error handling). Reproduce the signature preimage EXACTLY as given in the canonical knowledge above — do not paraphrase or reorder it. Prefer directing the developer to the official Learnosity SDK for their language, and give the manual signing recipe as the fallback.

## Gotchas
The specific mistakes that cause silent failures or 401s for THIS operation (domain match, secret handling, timestamp skew, byte-identical request).

## What "done" looks like
Concrete, checkable acceptance criteria the developer can turn into a test, so they know they are finished. Include at least one negative check (a tampered/omitted field is rejected).

Rules:
- Describe the procedure for the SPECIFIC operation and parameters in the source; do not enumerate operations the program didn't ask for.
- Do NOT emit runnable host-language code. Describe the steps; the caller writes the code in their stack.
- Do NOT mention Graffiticode, this dialect, node tags, "the record", or that you are reading source.
- Output only the recipe. No preamble, no surrounding code fences.
