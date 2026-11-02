import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "date-picker",
  title: "Date Picker",
  category: "forms",
  description: "A calendar with no date library: single days or ranges, limits, a full keyboard grid and any locale, in four layouts.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "Few people know what weekday the 19th falls on, or how many nights a stay runs. A month laid out as a grid shows that without any counting, and days outside the allowed range are visibly closed before anyone tries them.",
    avoid:
      "Do not make people page back through decades for a birth date: use the compact variant so they can type it. Do not offer a calendar for a date that has no meaning on a grid, such as a card expiry month.",
  },
  designs: [
    {
      name: "plain",
      principle: "Progressive disclosure",
      use: "In a form where a date is one field among several: a button that opens the calendar only when asked.",
    },
    {
      name: "inline",
      principle: "Visibility",
      use: "When choosing a date is the main job of the screen, such as booking an appointment.",
    },
    {
      name: "compact",
      principle: "Flexibility and efficiency",
      use: "For dates people already know, such as a birthday or a contract start: typing is faster, and the calendar stays one press away.",
    },
    {
      name: "range",
      principle: "Law of common region",
      use: "For stays and reports: two months and one band, so a period that crosses a month end reads as one thing.",
    },
  ],
  effects: [
    {
      name: "slide",
      principle: "Spatial continuity",
      use: "When people page through months often: next always moves one way and previous the other, and a second press interrupts cleanly.",
    },
  ],
  usage: `import { Calendar, DatePicker } from "@/components/ui/date-picker"

<DatePicker placeholder="Pick a delivery day" min={new Date()} onValueChange={setDay} />
<DatePicker variant="compact" aria-label="Date of birth" locale="en-GB" />
<DatePicker variant="range" effect="slide" name="stay" />

// Or just the grid
<Calendar mode="range" months={2} value={range} onValueChange={setRange} />`,
  exports: ["DatePicker", "Calendar"],
}
