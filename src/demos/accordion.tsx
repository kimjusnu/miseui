import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  type AccordionProps,
  type AccordionVariant,
} from "@/registry/miseui/ui/accordion"

const VARIANTS: readonly AccordionVariant[] = ["plain", "card", "separated", "flush"]

const ROWS = [
  {
    value: "refunds",
    question: "When do refunds arrive?",
    answer: "Within five working days, on the card you paid with. You get an email when it leaves us.",
  },
  {
    value: "seats",
    question: "Can I add seats mid-month?",
    answer: "Yes. New seats are charged for the days left in the month, and the invoice shows each one.",
  },
  {
    value: "export",
    question: "How do I export my data?",
    answer: "Settings, then Data, then Export. You get a zip of CSV files within a few minutes.",
  },
] as const

function Faq(props: AccordionProps) {
  return (
    <Accordion {...props}>
      {ROWS.map((row) => (
        <AccordionItem key={row.value} value={row.value}>
          <AccordionTrigger>{row.question}</AccordionTrigger>
          <AccordionContent>{row.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{variant}</p>
          <Faq variant={variant} defaultValue="refunds" />
        </div>
      ))}
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">spring effect, several rows open</p>
        <Faq type="multiple" variant="card" effect="spring" defaultValue={["refunds"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">spring effect, plus icon</p>
        <Faq variant="separated" effect="spring" icon="plus" />
      </div>
    </div>
  )
}
