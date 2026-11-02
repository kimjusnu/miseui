# Navigation Menu

Site navigation with panels that open from the bar, by pointer or keyboard.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/navigation-menu.json
```

## Why it looks like this

**Information scent.** People choose where to go from the words in front of them. A panel with a line under each link answers what is in there before anyone leaves the page, while the bar stays short enough to scan at a glance.

**Don't.** Do not put a whole site map in the panel, and do not use it for actions such as Save or Delete; those belong in a menu or a toolbar. Never hide the only route to a page behind hover: every trigger also opens with a press.

## Designs

Pass one as the `variant` prop.

- `bar` (Familiarity): The default for an app or a small site: quiet links and short panels that sit under their trigger.
- `mega` (Chunking): For a marketing site with many destinations, where a full-width panel sorts them into named columns.
- `pill` (Figure and ground): For a short product nav in a compact header, where a pill sliding behind the words marks the place.
- `underline` (Continuity): For a section nav above content, where a rule along the bottom ties the links to the page below.

## Effects

Pass one as the `effect` prop.

- `materialize` (Object constancy): When people sweep across triggers: one panel changes size and place between them instead of closing and opening again.

## Usage

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

<NavigationMenu aria-label="Site" effect="materialize">
  <NavigationMenuList>
    <NavigationMenuItem value="product">
      <NavigationMenuTrigger>Product</NavigationMenuTrigger>
      <NavigationMenuContent>
        <NavigationMenuPanelLink href="/forms" title="Forms" description="Collect answers" />
      </NavigationMenuContent>
    </NavigationMenuItem>
    <NavigationMenuItem>
      <NavigationMenuLink href="/pricing" active>Pricing</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenu>
```

Exports: `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuPanelLink`, `NavigationMenuGroup`
