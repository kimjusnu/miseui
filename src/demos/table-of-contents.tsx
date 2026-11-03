import { useId, useMemo, useRef } from "react"
import { TableOfContents, type TableOfContentsVariant } from "@/registry/miseui/ui/table-of-contents"

const SECTIONS = [
  {
    key: "returns",
    title: "Returns",
    level: 2,
    body: "Anything unworn can come back within thirty days. Print the label from your order page, drop the parcel at any partner shop and keep the receipt until the refund arrives.",
  },
  {
    key: "refunds",
    title: "Refunds",
    level: 3,
    body: "Money goes back to the card you paid with, five working days after the parcel reaches us. You get an email when it leaves, and your bank may take a little longer to show it.",
  },
  {
    key: "exchanges",
    title: "Exchanges",
    level: 3,
    body: "Need another size? Choose exchange on the order page and we send the new one first. You then have fourteen days to return the old one, using the same label.",
  },
  {
    key: "shipping",
    title: "Shipping",
    level: 2,
    body: "Orders placed before two in the afternoon leave the same day. Standard delivery takes two to three days, and the tracking link arrives by email as soon as the courier scans the parcel.",
  },
  {
    key: "contact",
    title: "Contact",
    level: 2,
    body: "Our team answers within one working day.",
  },
] as const

function Reading({ variant, effect, label, read }: { variant: TableOfContentsVariant; effect?: "spring"; label: string; read?: boolean }) {
  const prefix = useId()
  const scrollRef = useRef<HTMLDivElement>(null)
  const items = useMemo(() => SECTIONS.map(({ key, title, level }) => ({ id: `${prefix}${key}`, title, level })), [prefix])
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <TableOfContents
        items={read ? undefined : items}
        containerRef={read ? scrollRef : undefined}
        scrollRef={scrollRef}
        scrollOffset={8}
        variant={variant}
        effect={effect}
        title={variant === "floating" ? undefined : "On this page"}
        // The demo keeps the phone button in its cell instead of on the corner of the screen.
        className="max-sm:static"
      />
      <div ref={scrollRef} tabIndex={0} role="region" aria-label={`Returns policy, ${label}`} className="h-40 overflow-y-auto rounded-md border bg-background p-3 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        {SECTIONS.map(({ key, title, level, body }) => {
          const Heading = level === 2 ? "h2" : "h3"
          return (
            <section key={key} className="pb-4 last:pb-0">
              <Heading id={read ? undefined : `${prefix}${key}`} className="text-sm font-medium outline-none">
                {title}
              </Heading>
              <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{body}</p>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Reading variant="line" label="line, read from the headings" read />
      <Reading variant="plain" label="plain" />
      <Reading variant="dots" label="dots" />
      <Reading variant="floating" label="floating, a button on phones" />
      <Reading variant="line" effect="spring" label="spring effect, line" />
      <Reading variant="plain" effect="spring" label="spring effect, plain" />
    </div>
  )
}
