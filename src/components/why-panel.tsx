import type { ComponentMeta } from "@/src/content/types"

export function WhyPanel({ why }: { why: ComponentMeta["why"] }) {
  return (
    <section aria-labelledby="why-heading" className="rounded-2xl bg-card p-6 md:p-8">
      <p id="why-heading" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Why it looks like this
      </p>
      <p className="text-title mt-2 text-2xl">{why.principle}</p>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-pretty">{why.explanation}</p>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground">
        <span className="font-medium text-foreground">Don't. </span>
        {why.avoid}
      </p>
    </section>
  )
}
