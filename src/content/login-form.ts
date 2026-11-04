import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "login-form",
  title: "Login Form",
  category: "blocks",
  description: "A login with labels that stay visible and inline errors, in three forms: beside a calm brand panel with a password you can reveal, one card on a grey ground, or email only with a check-your-inbox screen.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "Logging in is a test of memory, so the layout removes everything that adds to the load. Labels stay above the fields instead of vanishing like placeholders, the password can be revealed instead of retyped blind, and the browser's password manager is told exactly which field is which. An error appears next to the field it concerns and keeps what was typed.",
    avoid:
      "Do not use the panel for a quote or a customer logo you cannot back up; one true sentence and a few pieces of your real product are enough, so replace the sample invoice through the visual prop. Do not disable paste on the password field. Say which field failed only if that does not tell an attacker which emails have accounts.",
  },
  designs: [
    {
      name: "split",
      principle: "Aesthetic-usability effect",
      use: "People arrive here often and you have room to say one true thing about the product beside the form.",
    },
    {
      name: "centered",
      principle: "Law of common region",
      use: "A tool people log in to on the way to their work: one card, nothing else to read, and it sits inside any app shell.",
    },
    {
      name: "magic",
      principle: "Recognition over recall",
      use: "You have no passwords: one field, then a screen that says where the link went and offers another once mail has had time to arrive.",
    },
  ],
  usage: `import { LoginForm } from "@/components/login-form"

<LoginForm
  variant="split"
  className="min-h-dvh"
  brandName="Paperline"
  tagline="Invoices that chase themselves, so you do not have to."
  onSubmit={async ({ email, password }) => {
    await signIn(email, password) // a rejection's message appears inline
  }}
  onSocial={(id) => signInWith(id)}
/>

// One card on the grey ground
<LoginForm variant="centered" onSubmit={signIn} />

// No password
<LoginForm
  variant="magic"
  onSendLink={async (email) => {
    await sendMagicLink(email) // a rejection's message appears inline
  }}
  sentNote="It works for 15 minutes. Not there? Look in spam."
/>`,
  exports: ["LoginForm"],
}
