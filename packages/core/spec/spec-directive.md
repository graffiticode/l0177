<!-- SPDX-License-Identifier: CC-BY-4.0 -->
You are given the source of a Learnosity **Author API** integration design (one `author-*` construct with a record of design properties) in this dialect, plus the dialect's canonical knowledge above. Produce a **developer integration RECIPE**: a precise, host-language-NEUTRAL procedure the caller implements in their own stack (Node, PHP, Ruby, .NET, …) to embed the described authoring experience.

Output these sections, in this order, as Markdown:

## Goal
One or two sentences: the authoring experience the developer will have working when done, specialized to the construct and the design's specifics (interpolate mode, domain, user, reference, allowed widget types, permissions, item bank).

## Preconditions
What the caller needs before starting: a Learnosity consumer key + secret (secret is **server-only**, never sent to the browser); the official server-side SDK for their language; the serving domain; a stable author user id; the target HTML element. If the design still has unfilled holes (missing required properties), state them here as "you must still provide: …".

## Procedure
Numbered steps. Be SURGICALLY PRECISE where correctness is binary — the `security` object fields and the `YYYYMMDD-HHMM` UTC timestamp, the exact `mode`, that `domain` must equal the serving host, where allowed widget types go in `config` — and ABSTRACT where it's the developer's own choice (their framework, HTTP, templating). Direct the developer to sign with the official Learnosity server-side SDK (do not hand-roll the signature). Cover: build the signed init object server-side; pass it to the page; call `LearnosityAuthor.init(initObject, callbacks, "<element>")`; wire `readyListener`/`errorListener`. Describe only the construct's mode; note there is no in-UI view switching.

## Gotchas
The specific mistakes that cause silent failures or 401s for THIS experience: domain mismatch, secret leaking to the browser, timestamp skew, missing `errorListener`, (for editing) an omitted `reference`.

## Verification steps
A concrete, ordered, runnable acceptance checklist the developer runs against THEIR implementation — each a pass/fail check — so they know they're done. Include at least one negative check. At minimum:
1. `readyListener` fires with no error and the editor renders in the target element.
2. A deliberately-tampered signature triggers `errorListener` (a 401-class error).
3. The init payload delivered to the browser contains no consumer secret.
4. The `domain` in `security` equals the host serving the page.
Add checks specific to the design (e.g. only the allowed widget types are offered; permissions match; the correct item/activity loads for the given `reference`).

Rules:
- Describe the procedure for the SPECIFIC construct + design properties present; don't cover modes the design didn't ask for.
- Do NOT emit runnable host-language code — describe the steps; the caller writes the code.
- Do NOT mention Graffiticode, this dialect, node tags, "the record", or that you are reading source.
- Output only the recipe. No preamble, no surrounding code fences.
