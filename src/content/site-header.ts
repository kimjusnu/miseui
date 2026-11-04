import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "site-header",
  title: "Site Header",
  category: "blocks",
  description: "A marketing site's top navigation with a skip link and a drawer on phones: a plain row of links, panels of grouped links, or pieces floating over the page.",
  why: {
    principle: "Jakob's law",
    explanation:
      "People spend most of their time on other sites, and they expect the name on the left, the links in the middle and the action on the right. Keeping that shape means nobody has to learn your header. The skip link lets a keyboard past it on every page, and the drawer keeps every link reachable when the row has no room.",
    avoid:
      "Do not use it inside an app, where a sidebar or the app shell holds far more and stays put. Do not hide short navigation behind a menu button on a wide screen: what people cannot see, they do not use.",
  },
  designs: [
    {
      name: "bar",
      principle: "Recognition over recall",
      use: "A site with a handful of pages. Every link is visible and one press away, and nothing opens over the page.",
    },
    {
      name: "mega",
      principle: "Chunking",
      use: "A product with more pages than a row can hold. Panels group them and say where each one goes, so nobody opens a page just to find out.",
    },
    {
      name: "floating",
      principle: "Figure and ground",
      use: "A site whose first screen is a picture worth keeping whole. The pieces sit over it, so no full-width bar cuts across the top.",
    },
  ],
  usage: `import { SiteHeader } from "@/components/site-header"

// The page goes inside, in a main that the skip link goes to.
<SiteHeader
  brandName="Paperline"
  links={[{ label: "Pricing", href: "/pricing" }, { label: "Docs", href: "/docs" }]}
  primaryAction={{ label: "Get started", href: "/signup" }}
  secondaryAction={{ label: "Log in", href: "/login" }}
  currentHref={pathname}
>
  <YourPage />
</SiteHeader>

// Your layout owns the main element. Attach to the window instead of the block.
<SiteHeader mainId="main" position="fixed" currentHref={pathname} />

// Grouped links. links sit after the menus.
<SiteHeader variant="mega" menus={[{ label: "Product", groups: [{ title: "Invoicing", links: [{ label: "Invoices", href: "/invoices", description: "Send, track and resend." }] }] }]} />

// Pieces over the page, sticking inside the block.
<SiteHeader variant="floating" links={links}><YourPage /></SiteHeader>`,
  exports: ["SiteHeader"],
}
