import type * as React from "react"
import { BookOpen, Compass, Sprout } from "lucide-react"
import { HoverPreview, HoverPreviewLink, type HoverPreviewEffect, type HoverPreviewVariant } from "@/registry/miseui/ui/hover-preview"
import { cn } from "@/registry/miseui/lib/utils"

function Picture({ icon: Icon, className }: { icon: React.ComponentType<{ className?: string }>; className: string }) {
  return (
    <div className={cn("grid size-full place-items-center", className)}>
      <Icon className="size-8 text-foreground/70" />
    </div>
  )
}

const ARTICLES = [
  {
    href: "#field-notes",
    label: "Field notes from a slow rollout",
    year: "2026",
    preview: {
      meta: "Six minute read",
      title: "Field notes from a slow rollout",
      text: "Why we shipped to one percent for a month, and what that caught.",
      media: <Picture icon={Compass} className="bg-mise-soft" />,
    },
  },
  {
    href: "#gardening",
    label: "Gardening a design system",
    year: "2025",
    preview: {
      meta: "Four minute read",
      title: "Gardening a design system",
      text: "Pruning components is most of the work, and nobody schedules it.",
      media: <Picture icon={Sprout} className="bg-muted" />,
    },
  },
  {
    href: "#reading",
    label: "How we read support tickets",
    year: "2024",
    preview: {
      meta: "Nine minute read",
      title: "How we read support tickets",
      text: "A weekly hour that changed our roadmap more than any survey.",
      media: <Picture icon={BookOpen} className="bg-accent" />,
    },
  },
] as const

const SHOWN: ReadonlyArray<{ title: string; variant: HoverPreviewVariant; effect?: HoverPreviewEffect }> = [
  { title: "card", variant: "card" },
  { title: "media", variant: "media" },
  { title: "tag", variant: "tag" },
  { title: "tilt effect", variant: "card", effect: "tilt" },
]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {SHOWN.map(({ title, variant, effect }) => (
        <div key={title} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{title}, hover with a mouse or tab to a row</p>
          <HoverPreview aria-label={`Articles, ${title}`} variant={variant} effect={effect}>
            {ARTICLES.map((article) => (
              <HoverPreviewLink
                key={article.href}
                href={article.href}
                aside={article.year}
                preview={article.preview}
                onClick={(event) => event.preventDefault()}
              >
                {article.label}
              </HoverPreviewLink>
            ))}
          </HoverPreview>
        </div>
      ))}
    </div>
  )
}
