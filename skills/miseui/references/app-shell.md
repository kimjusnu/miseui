# App Shell

The frame of an app: navigation, a top bar and a content region, with a skip link and landmarks, where the content scrolls on its own on wide screens.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/app-shell.json
```

## Why it looks like this

**Jakob's law.** People arrive knowing where navigation lives, because every other app put it there. A familiar frame lets them spend attention on the work. Keeping navigation still while only the content scrolls means the way out is always in view, and the skip link gives keyboard users the same shortcut past it.

**Don't.** Do not wrap a marketing page in this; its job is long scrolling, not staying in place. Do not nest one shell in another, because two main landmarks and two scrolling columns leave people lost.

## Designs

Pass one as the `variant` prop.

- `sidebar` (Spatial memory): An app with many sections that people move between all day. Narrow, the sidebar becomes a drawer behind a button in the top bar.
- `topbar` (Serial position effect): A product with a handful of sections, where width should go to the content. Links take their own scrolling row on a phone.
- `split` (Context preservation): Mail, tickets and chat: choosing in the list shows the detail beside it, and on a phone one pane replaces the other with a way back.
- `centered` (Optimal line length): Settings, documents and forms, where text reads best in one column and side navigation would only pull at the eye.

## Usage

```tsx
import { AppShell } from "@/components/ui/app-shell"
import { Sidebar, SidebarContent, SidebarGroup, SidebarItem } from "@/components/ui/sidebar"

<AppShell
  title="Invoices"
  actions={<Button size="sm">New invoice</Button>}
  sidebar={
    <Sidebar label="Main">
      <SidebarContent>
        <SidebarGroup>
          <SidebarItem href="/invoices" active>Invoices</SidebarItem>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  }
>
  <InvoiceList />
</AppShell>

<AppShell variant="split" list={<Threads />} detailOpen={Boolean(openId)} onBack={() => setOpenId(null)}>
  <Thread id={openId} />
</AppShell>
```

Exports: `AppShell`
