import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "search-field",
  title: "Search Field",
  category: "forms",
  description: "A search box with a leading icon, clear button, loading state, debounced onSearch and a Mod K hint. Escape clears it.",
  why: {
    principle: "Doherty threshold",
    explanation:
      "Results that follow typing within a moment feel like a conversation. A debounce waits until a word is finished so the page is not repainted for every letter, the spinner shows the wait is being worked on, and the leading magnifier says what the box is before anyone reads the placeholder.",
    avoid:
      "Do not use it to pick one value from a known list; a combobox does that. Do not use it for a palette of commands; that is a command menu. And do not rely on the placeholder alone as its label on a page with several fields.",
  },
  designs: [
    {
      name: "plain",
      principle: "Consistency",
      use: "Beside the other inputs of a form or a filter row, where it should look like one of them.",
    },
    {
      name: "pill",
      principle: "Affordance",
      use: "In an app header, where its filled capsule shape reads as search at a glance without adding a frame.",
    },
    {
      name: "ghost",
      principle: "Figure and ground",
      use: "Inside a toolbar or a list header that already has a frame, showing a hairline only when it is used.",
    },
    {
      name: "large",
      principle: "Visual hierarchy",
      use: "When search is the main thing on the page, such as a help centre or a documentation home.",
    },
  ],
  effects: [
    {
      name: "spinner-swap",
      principle: "Spatial continuity",
      use: "When the wait is common, so the icon people already look at becomes the spinner and no new thing appears at the far end of the field.",
    },
  ],
  usage: `import { SearchField } from "@/components/ui/search-field"

const [loading, setLoading] = useState(false)

<SearchField
  variant="pill"
  effect="spinner-swap"
  shortcut
  loading={loading}
  placeholder="Search invoices"
  onSearch={async (query) => {
    setLoading(true)
    setResults(await find(query))
    setLoading(false)
  }}
/>`,
  exports: ["SearchField"],
}
