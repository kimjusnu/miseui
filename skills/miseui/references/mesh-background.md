# Mesh Background

Large soft colour from the accent and its neighbours, barely tinted to vivid, from one corner or split on a diagonal, with an optional slow drift.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/mesh-background.json
```

## Why it looks like this

**Aesthetic-usability effect.** Soft colour makes a page feel considered before anyone reads it, and it needs no image to do so. Every colour comes from your accent and the hues beside it, so the page still belongs to your palette, and nothing has an edge for the eye to catch on.

**Don't.** Do not use it on every section; once per page gives it weight. On every variant except soft, set body text in foreground, because muted foreground drops below 4.5:1 where the colour is strongest. Do not rely on it for any meaning.

## Designs

Pass one as the `variant` prop.

- `soft` (Restraint): On a product page or a sign-in screen, where the tint is barely there and body text keeps its usual colours.
- `vivid` (Focal point): In one hero with a solid button on top, as the single loud thing on the page.
- `corner` (Directional cue): In a section with text on the left: colour enters from the top right and the rest stays clean.
- `split` (Common fate): On a banner or a closing call to action, where two colours meeting on a diagonal give a calm sense of direction.

## Effects

Pass one as the `effect` prop.

- `drift` (Ambient motion): In a hero people stay on, where colours moving over about a minute make the page feel alive without being watched. Wire `paused` to a control.

## Usage

```tsx
import { MeshBackground } from "@/components/ui/mesh-background"

<MeshBackground variant="vivid" className="rounded-xl py-24">
  <h1>Start with the first page</h1>
  <Button>Create a workspace</Button>
</MeshBackground>

<MeshBackground variant="soft" effect="drift" paused={paused}>…</MeshBackground>
```

Exports: `MeshBackground`, `MESH_BLOBS`
