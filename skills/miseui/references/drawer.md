# Drawer

A panel that slides in from an edge for a side task, so the page you came from stays where you left it.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/drawer.json
```

## Why it looks like this

**Spatial continuity.** A panel that arrives from an edge keeps the page in peripheral view, so people know where they are and how to get back. It holds more than a dialog without the cost of a navigation, and Escape or the corner button returns them to the exact scroll position they left.

**Don't.** Do not use a drawer for a two-button confirmation; that is a dialog. Do not open a drawer from inside a drawer, and do not use one for the main task of a page.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): For filters or details in a dashboard, where a full-height panel at the edge reads as part of the application frame.
- `floating` (Perceived depth): When the page should stay visible all around the panel, so it reads as a temporary layer over the work.
- `split` (Parallel task support): For notes or a chat beside the page, when people must keep reading and clicking the content behind it.
- `sheet` (Fitts's law): On phones, where the bottom edge is in thumb reach and pulling the handle down is the natural way out.

## Effects

Pass one as the `effect` prop.

- `push` (Depth of field): When the panel takes over the task: it comes into focus as the page recedes behind a deep blur.

## Usage

```tsx
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerBody, DrawerFooter, DrawerClose } from "@/components/ui/drawer"

<Drawer side="right" variant="floating" effect="push">
  <DrawerTrigger>Filters</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Filters</DrawerTitle>
      <DrawerDescription>Narrow the list of invoices.</DrawerDescription>
    </DrawerHeader>
    <DrawerBody>…</DrawerBody>
    <DrawerFooter><DrawerClose>Apply</DrawerClose></DrawerFooter>
  </DrawerContent>
</Drawer>
```

Exports: `Drawer`, `DrawerTrigger`, `DrawerClose`, `DrawerContent`, `DrawerHeader`, `DrawerBody`, `DrawerFooter`, `DrawerTitle`, `DrawerDescription`
