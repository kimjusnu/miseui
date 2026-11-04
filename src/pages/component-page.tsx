import { Suspense } from "react"
import { useParams } from "react-router"
import { findComponent } from "@/src/content"
import { CATEGORY_LABELS } from "@/src/content/types"
import { demos } from "@/src/demos"
import { installCommand } from "@/src/lib/site"
import { BlockPreview } from "@/src/components/block-preview"
import { CodeBlock } from "@/src/components/code-block"
import { WhyPanel } from "@/src/components/why-panel"
import { NotFound } from "./not-found"

export function ComponentPage() {
  const { name = "" } = useParams()
  const meta = findComponent(name)
  const Demo = demos[name]
  if (!meta || !Demo) return <NotFound />

  return (
    <article className="flex flex-col gap-10">
      <header>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {CATEGORY_LABELS[meta.category]}
        </p>
        <h1 className="text-display mt-2 text-4xl">{meta.title}</h1>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted-foreground">{meta.description}</p>
      </header>

      {meta.category === "blocks" ? (
        // Keyed by name: moving to another block must not carry over a variant it does not have.
        <BlockPreview key={meta.name} name={meta.name} designs={meta.designs}>
          {(variant) => (
            <Suspense fallback={<div className="min-h-96" />}>
              <Demo variant={variant} />
            </Suspense>
          )}
        </BlockPreview>
      ) : (
        <section aria-label="Demo" className="flex min-h-56 items-center rounded-2xl bg-card p-8 md:p-10">
          {/* The panel is a flex row: without this wrapper a demo sizes to its content and can push the page wide. */}
          <div className="w-full min-w-0">
            <Suspense fallback={null}>
              <Demo />
            </Suspense>
          </div>
        </section>
      )}

      <WhyPanel why={meta.why} designs={meta.designs} effects={meta.effects} />

      <section aria-labelledby="install-heading" className="flex flex-col gap-3">
        <h2 id="install-heading" className="text-lg font-semibold">
          Install
        </h2>
        <CodeBlock code={installCommand(meta.name)} language="bash" />
      </section>

      <section aria-labelledby="usage-heading" className="flex flex-col gap-3">
        <h2 id="usage-heading" className="text-lg font-semibold">
          Usage
        </h2>
        <CodeBlock code={meta.usage} />
        <p className="flex flex-wrap gap-x-2 text-sm text-muted-foreground">
          Exports:
          {meta.exports.map((name) => (
            <code key={name} className="font-mono text-[13px]">
              {name}
            </code>
          ))}
        </p>
      </section>
    </article>
  )
}
