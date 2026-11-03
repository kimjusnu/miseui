import { CardDeck, type CardDeckSlide, type CardDeckVariant } from "@/registry/miseui/ui/card-deck"

const SLIDES: readonly CardDeckSlide[] = [
  {
    id: "why",
    kicker: "Context",
    title: "Half of new teams stopped at step two",
    body: "The invite screen asked for a billing address before anyone had seen the product.",
  },
  {
    id: "what",
    kicker: "The change",
    title: "Three screens became one",
    body: "Billing moved to the first paid action, and invites now send from the empty state.",
  },
  {
    id: "result",
    kicker: "Six weeks later",
    title: "More teams reached their first project",
    stats: [
      { label: "Activation", value: "58%" },
      { label: "Time to start", value: "4 min" },
    ],
  },
  {
    id: "next",
    kicker: "Next quarter",
    title: "Do the same for the mobile sign-up",
    body: "It still has the old order, and a third of sign-ups start there.",
  },
]

const VARIANTS: readonly CardDeckVariant[] = ["slides", "stack", "story", "outline"]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{variant}</p>
          <CardDeck label={`Onboarding review, ${variant}`} slides={SLIDES} variant={variant} />
        </div>
      ))}
      <div className="grid min-w-0 content-start gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">rewind effect, starts on the last slide</p>
        <CardDeck label="Onboarding review, rewind" slides={SLIDES} effect="rewind" defaultIndex={3} />
      </div>
    </div>
  )
}
