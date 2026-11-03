import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "sidebar",
  title: "Sidebar",
  category: "navigation",
  description: "A column of navigation that collapses to icons, nests groups, marks the current page and turns into a drawer on phones.",
  why: {
    principle: "Spatial memory",
    explanation:
      "People find things in an app by where they last saw them. A sidebar keeps every destination in one fixed place and marks where you are, so returning takes no thought. Collapsing gives the width back to the work without moving anything, because each icon stays exactly where it was.",
    avoid:
      "Do not use one for an app with three or four pages; tabs or a top bar cost less room. Avoid nesting more than one level, and never rely on icons alone without the name a tooltip gives them.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "The default for tools: a hairline separates navigation from the page and nothing competes with the content.",
    },
    {
      name: "floating",
      principle: "Elevation",
      use: "A lighter product or a full-bleed canvas behind it, where a card that sits off the edges keeps the page feeling open.",
    },
    {
      name: "inset",
      principle: "Law of common region",
      use: "When the page is the object: a tinted column runs around a raised content surface, and the active item lifts to match it.",
    },
    {
      name: "rail",
      principle: "Recognition over recall",
      use: "Experts in an app they use all day, or a screen with a second column already. Icons only, with a tooltip for each name and a menu for nested pages.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Interruptibility",
      use: "Whenever people toggle often: the width carries on from where it is, so a quick second press reverses it, and words wipe away at the edge rather than popping out.",
    },
  ],
  usage: `import {
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
</SidebarProvider>`,
  exports: [
    "Sidebar",
    "SidebarProvider",
    "SidebarHeader",
    "SidebarContent",
    "SidebarFooter",
    "SidebarGroup",
    "SidebarItem",
    "SidebarNested",
    "SidebarTrigger",
    "SidebarInset",
    "useSidebar",
    "isToggleShortcut",
  ],
}
