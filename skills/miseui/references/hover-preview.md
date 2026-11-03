# Hover Preview

A preview that follows the pointer over a list of links, so people can look before they commit to a click.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/hover-preview.json
```

## Why it looks like this

**Information scent.** People decide whether to follow a link from the clues around it. A picture or a line that appears at the point of attention answers what is behind this without a page load, and a plain text list keeps its calm until someone shows interest.

**Don't.** Never put anything in the preview that cannot be reached another way: it does not exist on touch, and it cannot be clicked. For a preview people need to interact with, use Hover Card.

## Designs

Pass one as the `variant` prop.

- `card` (Information scent): For articles or case studies, where a picture, a title and one line help someone choose between rows that look alike.
- `media` (Picture superiority effect): For visual work such as a portfolio or a photo index: the row stays quiet and the image does all the talking.
- `tag` (Signal to noise): For dense lists: one short line beside the pointer, such as the read time, without covering the rows around it.

## Effects

Pass one as the `effect` prop.

- `tilt` (Follow-through): On a showcase page: the preview leans into the pointer's direction and settles, as if carried. Reduced motion leaves it upright and without lag.

## Usage

```tsx
import { HoverPreview, HoverPreviewLink } from "@/components/ui/hover-preview"

<HoverPreview aria-label="Articles" effect="tilt">
  <HoverPreviewLink
    href="/writing/search"
    aside="2026"
    preview={{
      meta: "Six minute read",
      title: "Rebuilding search",
      text: "What we changed and what we would do differently.",
      media: <img src="/search.jpg" alt="" className="size-full object-cover" />,
    }}
  >
    Rebuilding search
  </HoverPreviewLink>
</HoverPreview>
```

Exports: `HoverPreview`, `HoverPreviewLink`
