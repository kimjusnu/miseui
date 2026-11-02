import { Link } from "react-router"
import { byCategory } from "@/src/content"
import type { ComponentMeta } from "@/src/content/types"

/**
 * Thumbnails are captures of the real blocks, not live renders. Six full screens with their beams, metal and
 * blur running at once stalled the main thread, and nobody can read motion at this size anyway.
 */
function BlockThumb({ meta }: { meta: ComponentMeta }) {
  return (
    <Link
      to={`/components/${meta.name}`}
      className="group mb-3 block break-inside-avoid rounded-[22px] border bg-card p-1.5 outline-none transition-[background-color,scale] duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[0.995] active:duration-100"
    >
      <img
        src={`/thumbs/${meta.name}.webp`}
        alt={`${meta.title} block preview`}
        loading="lazy"
        decoding="async"
        className="w-full rounded-2xl border bg-background dark:hidden"
      />
      <img
        src={`/thumbs/${meta.name}-dark.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        className="hidden w-full rounded-2xl border bg-background dark:block"
      />
      <div className="flex items-baseline justify-between gap-3 px-2.5 pt-2.5 pb-1.5">
        <span className="text-sm font-medium">{meta.title}</span>
        <span className="truncate text-[13px] text-muted-foreground">{meta.why.principle}</span>
      </div>
    </Link>
  )
}

/** A wall of real screens. People who do not design choose by looking. */
export function BlockGallery({ limit }: { limit?: number }) {
  const blocks = byCategory("blocks")
  const shown = limit ? blocks.slice(0, limit) : blocks
  return (
    <div className="columns-1 gap-3 md:columns-2 xl:columns-3">
      {shown.map((meta) => (
        <BlockThumb key={meta.name} meta={meta} />
      ))}
    </div>
  )
}
