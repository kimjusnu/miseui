# Sidebar

A column of navigation that collapses to icons, nests groups, marks the current page and turns into a drawer on phones.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/sidebar.json
```

## Why it looks like this

**Spatial memory.** People find things in an app by where they last saw them. A sidebar keeps every destination in one fixed place and marks where you are, so returning takes no thought. Collapsing gives the width back to the work without moving anything, because each icon stays exactly where it was.

**Don't.** Do not use one for an app with three or four pages; tabs or a top bar cost less room. Avoid nesting more than one level, and never rely on icons alone without the name a tooltip gives them.

## Designs

Pass one as the `variant` prop.

- `plain` (Figure and ground): The default for tools: a hairline separates navigation from the page and nothing competes with the content.
- `floating` (Elevation): A lighter product or a full-bleed canvas behind it, where a card that sits off the edges keeps the page feeling open.
- `inset` (Law of common region): When the page is the object: a tinted column runs around a raised content surface, and the active item lifts to match it.
- `rail` (Recognition over recall): Experts in an app they use all day, or a screen with a second column already. Icons only, with a tooltip for each name and a menu for nested pages.

## Effects

Pass one as the `effect` prop.

- `spring` (Interruptibility): Whenever people toggle often: the width carries on from where it is, so a quick second press reverses it, and words wipe away at the edge rather than popping out.

## Usage

```tsx
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarHeader, SidebarItem, SidebarNested, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"

<SidebarProvider
  variant="floating"
  effect="spring"
  collapsed={settings.navCollapsed}
  onCollapsedChange={(collapsed) => save({ navCollapsed: collapsed })}
>
  <Sidebar label="Main">
    <SidebarHeader>Harbor</SidebarHeader>
    <SidebarContent>
      <SidebarGroup label="Workspace">
        <SidebarItem icon={<Inbox />} href="/inbox" active badge={3}>Inbox</SidebarItem>
        <SidebarNested icon={<Folder />} label="Projects" defaultOpen>
          <SidebarItem render={(props) => <Link to="/atlas" {...props} />}>Atlas</SidebarItem>
        </SidebarNested>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarTrigger />
</SidebarProvider>
```

Exports: `Sidebar`, `SidebarProvider`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarItem`, `SidebarNested`, `SidebarTrigger`, `SidebarInset`, `useSidebar`, `isToggleShortcut`
