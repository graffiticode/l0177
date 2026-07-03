<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Usage Guide

Agent-facing guide for the Learnosity **Authoring Integration** oracle. Read this before composing a `create_item` prompt.

## Overview

L0177 is a developer-integration oracle: it does not author assessment content — it produces a precise, host-language-neutral **recipe** for integrating the Learnosity **Author API** and **item bank (Data API)** into your own app. You describe an authoring-integration task in natural language ("embed the Learnosity item editor for this user on this domain", "save this item to my item bank", "list items tagged with a standard"), L0177 verifies the canonical request construction, and its `get_spec` output is the recipe: **goal, preconditions, procedure (including the exact signature preimage), gotchas, and acceptance criteria** — what to do and how to know you are done. You then implement it in your own stack (Node, PHP, Ruby, .NET). L0177 never writes item content (that is L0176) and never emits runnable code.

## Workflow

1. `list_languages(domain: "learnosity")` and pick L0177 when the task is *how to integrate* Learnosity authoring — not authoring an item's content.
2. `create_item("L0177", "<the integration task, with your specifics>")` — name the operation intent, the end-user id, your serving domain, and any allowed widget types.
3. `get_item(item_id)` — confirms the request constructs and signs (structural proof).
4. `get_spec(item_id)` — returns the recipe. Implement it in your host language and check your work against its acceptance criteria.

## Operations

| Operation      | What the recipe covers                                                                 |
|----------------|-----------------------------------------------------------------------------------------|
| `embed-editor` | Embedding the Author API item editor: signed init request, allowed widget types, user identity, domain match. |
| `save-item`    | Creating an item in the item bank via the Data API (`/itembank/items`), with the caller's own credentials.   |
| `update-item`  | Updating an existing item bank item.                                                    |
| `fetch-item`   | Fetching a single item's definition from the item bank.                                 |
| `list-items`   | Listing/searching the item bank with filters and pagination.                            |
| `tag-items`    | Attaching item metadata/tags (standards, DOK, difficulty) so the Author Site indexes them. |

## Writing a good request

- **Name the operation** if you know it ("embed the item editor", "save to the item bank", "list items").
- **Give your serving domain** for editor embeds — Learnosity signs against it and a mismatch is the #1 cause of a 401.
- **Give a stable user id** for editor embeds.
- **Name allowed widget types** if you want to restrict the editor (e.g. "MCQ and cloze only").
- **Say whether you'll use your own credentials** (required for any item-bank write).

## Credentials

Item-bank writes require the caller's own Learnosity consumer key/secret. Supply them to the compiled proof via `set-var "learnosity-key"` / `set-var "learnosity-secret"` (both together). Without them, the oracle still produces the recipe and a structural (placeholder-signed) proof; it just can't perform a live item-bank write.

## Out of scope

- Authoring item **content** → L0176.
- Delivering assessments to learners (Items API, sessions, SSO) → L0178.
- Reading responses/scores or building reports → L0179.
- Runnable host-language code — the recipe is a language-neutral procedure you implement yourself.
