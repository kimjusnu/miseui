import type * as React from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, type AccordionVariant } from "@/registry/miseui/ui/accordion"
import { cn } from "@/registry/miseui/lib/utils"
import type { FaqItem } from "./faq-section-filter"

interface FaqContact {
  /** Comes before the link, as a question. */
  prompt: string
  label: string
  href: string
}

interface FaqSectionCopyProps extends React.ComponentProps<"section"> {
  headline?: string
  /** Continues the headline in the same size, one tone quieter. */
  headlineQuiet?: string
  items?: readonly FaqItem[]
  /** Where to go when the answer is not here. Null removes the line. */
  contact?: FaqContact | null
}

const DEFAULT_COPY = {
  headline: "Questions, answered.",
  headlineQuiet: "The ones people ask before they invite it to a call.",
} as const

const DEFAULT_CONTACT: FaqContact = { prompt: "Did not find it?", label: "Write to support", href: "#support" }

const DEFAULT_ITEMS: readonly FaqItem[] = [
  { id: "join", question: "Does it join calls on its own?", answer: "Only when you invite it. It stays out of your calendar until you turn that on, and you can turn it on for one calendar at a time." },
  { id: "access", question: "Who can read a summary?", answer: "Everyone who was on the call, and anyone they share it with. Nobody else in your workspace sees it by default." },
  { id: "delete", question: "Can I delete a recording?", answer: "Yes, one at a time or all at once, from the call or from settings. The summary stays unless you delete that too.", keywords: "remove erase privacy" },
  { id: "trial", question: "What happens when the trial ends?", answer: "Nothing is charged until you pick a plan. Your summaries stay readable, and new calls stop being recorded.", keywords: "free billing payment" },
  { id: "export", question: "Can I take my data with me?", answer: "Export every summary as Markdown or PDF from settings, at any time and on any plan.", keywords: "download backup" },
  { id: "languages", question: "Which languages does it understand?", answer: "It follows the language of the call and writes the summary in the same one. You can ask for a translation afterwards.", keywords: "translate korean" },
  { id: "cancel", question: "How do I cancel?", answer: "From billing settings, with no call and no form. You keep access until the end of the period you paid for.", keywords: "refund stop subscription" },
]

/** Not centred in a tall frame like the other sections: this one changes height as rows open and results filter, and the row or the box under the pointer would move with it. */
const ROOT_CLASS = "@container flex w-full flex-col justify-start"

/** The bigger press area on touch comes from a pseudo element, because this link sits inside a sentence. */
const CONTACT_LINK_CLASS =
  "relative rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-foreground/70 focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-2.5"

function FaqHeading({ headline, quiet, className }: { headline: string; quiet: string; className?: string }) {
  return (
    <h2 className={cn("text-title text-3xl text-balance @2xl:text-4xl", className)}>
      {headline} <span className="text-muted-foreground">{quiet}</span>
    </h2>
  )
}

function FaqContactLine({ contact, className }: { contact: FaqContact | null; className?: string }) {
  if (!contact) return null
  return (
    <p className={cn("text-sm leading-5 text-muted-foreground", className)}>
      {contact.prompt}{" "}
      <a href={contact.href} className={CONTACT_LINK_CLASS}>
        {contact.label}
      </a>
    </p>
  )
}

interface FaqListProps {
  items: readonly FaqItem[]
  variant: AccordionVariant
  /** The question open at first. Showing one answer teaches the row is pressable and how long answers are. */
  defaultOpen?: string
  className?: string
  itemClassName?: string
  triggerClassName?: string
  panelClassName?: string
}

function FaqList({ items, variant, defaultOpen, className, itemClassName, triggerClassName, panelClassName }: FaqListProps) {
  if (items.length === 0) return null
  return (
    <Accordion variant={variant} defaultValue={defaultOpen} className={className}>
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} className={itemClassName}>
          <AccordionTrigger className={cn("min-w-0 text-[15px] leading-snug", triggerClassName)}>{item.question}</AccordionTrigger>
          <AccordionContent className={cn("text-[15px]/relaxed text-pretty", panelClassName)}>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export { DEFAULT_CONTACT, DEFAULT_COPY, DEFAULT_ITEMS, FaqContactLine, FaqHeading, FaqList, ROOT_CLASS, type FaqContact, type FaqSectionCopyProps }
