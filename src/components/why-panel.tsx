import type { ComponentMeta } from "@/src/content/types"

interface WhyPanelProps {
  why: ComponentMeta["why"]
  effects?: ComponentMeta["effects"]
}

export function WhyPanel({ why, effects }: WhyPanelProps) {
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
      {effects?.length ? (
        <dl className="mt-6 grid gap-x-8 gap-y-4 border-t pt-6 sm:grid-cols-2">
          {effects.map((effect) => (
            <div key={effect.name}>
              <dt className="text-sm font-medium">
                <code className="font-mono text-[13px]">{effect.name}</code>
                <span className="text-muted-foreground"> · {effect.principle}</span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{effect.use}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  )
}
