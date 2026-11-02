# Tabs

Segmented control that swaps one panel for another in place, so related views share a single spot on the screen.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/tabs.json
```

## Why it looks like this

**Chunking.** People hold a handful of groups in working memory, not forty items. Tabs cut a dense screen into named chunks the user can scan in one line, and the active pill settles in 150 ms so the switch registers as a view change rather than a page load.

**Don't.** Do not use tabs when the user needs to compare two panels at once, or for steps that must be completed in order. Never put a required field behind an inactive tab; hidden panels are easy to forget.

## Usage

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="activity">Activity</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Overview panel</TabsContent>
  <TabsContent value="activity">Activity panel</TabsContent>
</Tabs>
```

Exports: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
