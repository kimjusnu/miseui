interface SiteHeaderLink {
  label: string
  href: string
  /** One line saying where it goes, shown in `mega` panels. */
  description?: string
}

interface SiteHeaderGroup {
  title: string
  links: readonly SiteHeaderLink[]
}

interface SiteHeaderMenu {
  label: string
  groups: readonly SiteHeaderGroup[]
}

interface SiteHeaderAction {
  label: string
  href: string
}

const SAMPLE_LINKS: readonly SiteHeaderLink[] = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
  { label: "Changelog", href: "#changelog" },
]

const SAMPLE_MENU_LINKS: readonly SiteHeaderLink[] = [{ label: "Pricing", href: "#pricing" }]

const SAMPLE_MENUS: readonly SiteHeaderMenu[] = [
  {
    label: "Product",
    groups: [
      {
        title: "Invoicing",
        links: [
          { label: "Invoices", href: "#invoices", description: "Send, track and resend." },
          { label: "Reminders", href: "#reminders", description: "Follow up without writing it." },
        ],
      },
      {
        title: "Getting paid",
        links: [
          { label: "Payment links", href: "#links", description: "A page anyone can pay on." },
          { label: "Bank transfers", href: "#transfers", description: "Matched to the right invoice." },
        ],
      },
      {
        title: "Books",
        links: [
          { label: "Reports", href: "#reports", description: "What came in, by month." },
          { label: "Exports", href: "#exports", description: "Files your accountant can open." },
        ],
      },
    ],
  },
  {
    label: "Resources",
    groups: [
      {
        title: "Learn",
        links: [
          { label: "Guides", href: "#guides", description: "From first invoice to year end." },
          { label: "API docs", href: "#docs", description: "For building it into your tools." },
        ],
      },
      {
        title: "Stay current",
        links: [
          { label: "Changelog", href: "#changelog", description: "What shipped this month." },
          { label: "Status", href: "#status", description: "Whether everything is up." },
        ],
      },
    ],
  },
]

export { SAMPLE_LINKS, SAMPLE_MENUS, SAMPLE_MENU_LINKS, type SiteHeaderAction, type SiteHeaderGroup, type SiteHeaderLink, type SiteHeaderMenu }
