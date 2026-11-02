import type { ComponentMeta } from "@/src/content/types"

interface WhyPanelProps {
  why: ComponentMeta["why"]
  designs?: ComponentMeta["designs"]
  effects?: ComponentMeta["effects"]
}

function OptionList({ prop, options }: { prop: string; options: NonNullable<ComponentMeta["effects"]> }) {
  return (
    <div className="mt-6 border-t pt-6">
      <p className="text-sm font-medium">
        <code className="font-mono text-[13px]">{prop}</code>
      </p>
      <dl className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {options.map((option) => (
          <div key={option.name}>
            <dt className="text-sm font-medium">
              <code className="font-mono text-[13px]">{option.name}</code>
              <span className="text-muted-foreground"> {option.principle}</span>
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{option.use}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function WhyPanel({ why, designs, effects }: WhyPanelProps) {
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
      {designs?.length ? <OptionList prop="variant" options={designs} /> : null}
      {effects?.length ? <OptionList prop="effect" options={effects} /> : null}
    </section>
  )
}
