# Story Section

A numbered section of a long read, with the number, heading and text set three ways.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/story-section.json
```

## Why it looks like this

**Chunking.** A long page reads as manageable when it is visibly cut into a few numbered parts, and the numbers promise that there is an order and an end. The heading is a real landmark, so people using a screen reader can jump between the parts too.

**Don't.** Numbers imply sequence, so do not use it for parts that could be read in any order. On short pages a plain heading is enough.

## Designs

Pass one as the `variant` prop.

- `stacked` (Reading gravity): The default for articles and case studies, with one column from top to bottom.
- `aside` (Persistent context): Long sections on wide screens, where the heading stays in view beside the text and tells you which part you are in.
- `chapter` (Visual hierarchy): A few large parts of a story, where each one should feel like turning a page.

## Effects

Pass one as the `effect` prop.

- `reveal` (Staging): A page with a few big sections and little text: the text arriving marks the start of a new part.

## Usage

```tsx
import { StorySection } from "@/components/ui/story-section"

<StorySection id="problem" no={1} title="The problem">
  <p>Half of new teams never invited a second person.</p>
</StorySection>

// Before it is written, the section can hold the question it should answer
<StorySection no={3} title="The result" variant="aside" pending="What changed after launch?" />
```

Exports: `StorySection`
