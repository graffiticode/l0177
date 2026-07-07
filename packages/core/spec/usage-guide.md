<!-- SPDX-License-Identifier: CC-BY-4.0 -->
# L0177 Usage Guide

Agent-facing guide for the Learnosity **Author API integration** oracle. Read this before composing a `create_item` prompt.

## Overview

L0177 is a developer-integration oracle for the Learnosity **Author API**: it does not author assessment content — it produces a precise, host-language-neutral **recipe** for embedding and configuring an integrated **authoring experience** (the Learnosity item/activity editor or browser) in your own app. You describe the integration *design* — which experience to embed and how it's configured — L0177 validates it, flags any **holes** (missing required properties) as steering warnings, and via `get_spec` returns the recipe: goal, preconditions, procedure, gotchas, and runnable **verification steps**. You fill the holes over a few turns and implement the result in your own stack (Node, PHP, Ruby, .NET). L0177 never writes item content (that is L0176) and never emits runnable code.

## Workflow

1. `list_languages(domain: "learnosity")` and pick L0177 when the task is *how to integrate a Learnosity authoring experience* — not authoring an item's content.
2. `create_item("L0177", "<the integration design, with your specifics>")` — name the experience and the details you have (domain, author id, item reference, allowed question types, editor options).
3. `get_item(item_id)` — returns the normalized design plus `warnings` (design holes first, then specificity advisories). Refine with `update_item` until the warnings clear.
4. `get_spec(item_id)` — returns the recipe. Implement it and check your work against its verification steps.

## The four experiences (view functions)

The view function you use *is* the mode (there's no in-UI switch — each is a separate page/integration):

| View | Author API view | Notes |
|------|-----------------|-------|
| `item-edit` | Item editor (create/edit one item) | needs a `reference` |
| `item-list` | Item browser/list | partially modeled |
| `activity-edit` | Activity editor | `reference` optional; partially modeled |
| `activity-list` | Activity browser/list | partially modeled |

## Writing a good design

Everything is expressed in natural language — the generator writes the DSL. Give the details you have:
- **Name the experience** (edit an item? browse items? build an activity?).
- **The serving domain** — the signature binds to it; a mismatch is the #1 401.
- **The author's user id** — recorded in the item-bank audit trail.
- For editing, **the item/activity reference**.
- Optionally: **which question types authors may use**, editor options (edit/delete widgets, tags, dynamic content, shared passage), a **specific item bank**, container sizing.

The compiler validates each property, so under-specified or inconsistent designs come back as clear steering warnings to refine.

## Out of scope

- Authoring item **content** → L0176.
- Programmatic item-bank CRUD (Data API), assessment delivery (Items API), analytics (Reports API) → future L0177 modes.
- Runnable host-language code — the recipe is a language-neutral procedure you implement yourself.
