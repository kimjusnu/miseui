import type { ComponentMeta } from "@/src/content/types"

export function WhyPanel({ why }: { why: ComponentMeta["why"] }) {
  return (
    <section aria-labelledby="why-heading" className="border-l-2 border-mise pl-5">
      <p id="why-heading" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Why it looks like this
      </p>
      <p className="mt-2 font-display text-2xl leading-tight italic">{why.principle}</p>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-foreground/90">{why.explanation}</p>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Don't. </span>
        {why.avoid}
      </p>
    </section>
  )
}
