import { Link } from "react-router"
import { demos } from "@/src/demos"
import { findComponent } from "@/src/content"

/** Effects the home page leads with. Missing ones are skipped, so the page never breaks mid-build. */
const FEATURED = ["thinking-orb", "beam-border", "liquid-metal", "shimmer-text", "voice-glow", "gooey-morph"] as const

export function Showcase() {
  const featured = FEATURED.map((name) => ({ name, meta: findComponent(name), Demo: demos[name] })).filter(
    (item) => item.meta && item.Demo,
  )
  if (featured.length === 0) return null

  return (
    <section aria-label="Live effects" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {featured.map(({ name, meta, Demo }) => (
        <Link
          key={name}
          to={`/components/${name}`}
          className="group flex min-h-64 flex-col justify-between gap-6 rounded-2xl bg-card p-6 outline-none transition-[transform,background-color] duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.99]"
        >
          <div className="flex min-h-32 flex-1 items-center justify-center overflow-hidden">{Demo && <Demo />}</div>
          <div>
            <p className="text-[15px] font-medium">{meta?.title}</p>
            <p className="text-sm text-muted-foreground">{meta?.why.principle}</p>
          </div>
        </Link>
      ))}
    </section>
  )
}
