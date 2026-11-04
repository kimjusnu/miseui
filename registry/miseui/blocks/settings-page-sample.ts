import { Bell, CreditCard, TriangleAlert, UserRound } from "lucide-react"
import type { SettingsSection } from "./settings-page-form"

/** Invented sample content. The person, the plan and every figure are made up. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const SAMPLE_SECTIONS: readonly SettingsSection[] = [
  {
    id: "profile",
    title: "Profile",
    description: "How you appear to the people in this workspace.",
    icon: UserRound,
    rows: [
      {
        kind: "text",
        id: "name",
        label: "Display name",
        description: "Shown next to your comments and invoices.",
        value: "Mina Okafor",
        autoComplete: "name",
        validate: (value) => (value.trim() ? undefined : "Add a name so your team knows who this is."),
      },
      {
        kind: "text",
        id: "email",
        label: "Email",
        description: "Where receipts and sign-in links go.",
        value: "mina@example.com",
        type: "email",
        autoComplete: "email",
        validate: (value) => (EMAIL_PATTERN.test(value.trim()) ? undefined : "That does not look like an email address."),
      },
      {
        kind: "select",
        id: "timezone",
        label: "Time zone",
        description: "Used for the weekly summary and report dates.",
        value: "seoul",
        options: [
          { value: "seoul", label: "Seoul (GMT+9)" },
          { value: "london", label: "London (GMT+0)" },
          { value: "new-york", label: "New York (GMT-5)" },
        ],
      },
    ],
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Only what you would want to be interrupted for.",
    icon: Bell,
    rows: [
      {
        kind: "switch",
        id: "failed-payments",
        label: "Failed payments",
        description: "The moment a charge fails, so you can follow up the same day.",
        value: true,
      },
      {
        kind: "switch",
        id: "weekly-summary",
        label: "Weekly summary",
        description: "Monday at 9:00, last week's numbers in one email.",
        value: true,
      },
      {
        kind: "switch",
        id: "product-news",
        label: "Product news",
        description: "A short note when something ships, about once a month.",
        value: false,
      },
    ],
  },
  {
    id: "plan",
    title: "Plan",
    icon: CreditCard,
    rows: [
      {
        kind: "info",
        id: "current-plan",
        label: "Team",
        description: "$84 per month, renews on December 14.",
        actionLabel: "Change plan",
      },
      { kind: "info", id: "seats", label: "Seats", description: "2 seats are free to invite into.", value: "4 of 6 used" },
    ],
  },
  {
    id: "danger",
    title: "Delete workspace",
    tone: "danger",
    icon: TriangleAlert,
    rows: [
      {
        kind: "danger",
        id: "delete-workspace",
        label: "Delete this workspace",
        description: "Removes 1,284 customer records and every invite. You get 14 days to change your mind.",
        actionLabel: "Delete workspace",
        confirmLabel: "Yes, delete it",
        cancelLabel: "Keep workspace",
        doneMessage: "Deletion scheduled for 14 days from now.",
      },
    ],
  },
]

export { SAMPLE_SECTIONS }
