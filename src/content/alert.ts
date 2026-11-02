import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "alert",
  title: "Alert",
  category: "feedback",
  description: "An in-page message with a title, description, action and dismiss, in neutral, success, warning and error tones and four layouts.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "An alert states what happened and what to do next, in the place the person is already looking. Tone is carried by a glyph as well as colour, so a warning still reads as a warning for someone who cannot see the colour, and only errors interrupt a screen reader.",
    avoid:
      "Do not use one for something that just happened and needs no follow-up; that is a toast. Do not stack several on a page, because the second one is already ignored. Never make the only copy of a critical message dismissible.",
  },
  designs: [
    {
      name: "soft",
      principle: "Figure and ground",
      use: "The default inside a form or a settings page, where a tinted block sits with the content without shouting.",
    },
    {
      name: "outline",
      principle: "Fitts's law",
      use: "When there is one thing to do about it: the action sits at the far edge, large and easy to reach.",
    },
    {
      name: "banner",
      principle: "Salience",
      use: "For a state of the whole account or page, such as a failed payment, stretched edge to edge across the top.",
    },
    {
      name: "side",
      principle: "Pre-attentive processing",
      use: "In dense content such as docs or logs, where a coloured rail is seen before anything is read.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Object constancy",
      use: "When an alert appears or leaves in the middle of a page: its height springs, so the content below moves instead of jumping.",
    },
  ],
  usage: `import { Alert, AlertAction } from "@/components/ui/alert"

<Alert
  variant="outline"
  tone="warning"
  title="Storage almost full"
  description="You have 2 GB left. Uploads stop at the limit."
  action={<AlertAction onClick={openBilling}>Upgrade</AlertAction>}
  dismissible
  effect="materialize"
/>

<Alert variant="banner" tone="error" title="Payment failed." description="Update your card to keep access." />`,
  exports: ["Alert", "AlertAction"],
}
