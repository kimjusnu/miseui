import { PostRow, type PostRowProps } from "@/registry/miseui/ui/post-row"

const POSTS = [
  {
    title: "Writing empty states people read",
    date: "2026-10-28",
    tags: ["Design", "Writing"],
    excerpt: "What to say when there is nothing to show, and why the button matters more than the drawing.",
    meta: "6 min read",
  },
  {
    title: "Why the query planner ignored our index",
    date: "2026-09-14",
    tags: ["Engineering"],
    excerpt: "A stale statistic, one wrong row estimate and a fix that took a single line.",
    meta: "9 min read",
  },
  {
    title: "Onboarding without a tour",
    date: "2026-08-02",
    tags: ["Growth"],
    excerpt: "We removed the walkthrough and more people finished setting up.",
    meta: "4 min read",
  },
] as const

function List({ label, ...props }: Pick<PostRowProps, "variant" | "effect"> & { label: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <ul className="grid grid-cols-[minmax(0,1fr)]">
        {POSTS.map((post) => (
          <li key={post.title} className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
            <PostRow href="#post-row" {...post} {...props} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <List label="line" />
      <List label="stacked" variant="stacked" />
      <List label="ledger" variant="ledger" />
      <List label="nudge effect" effect="nudge" />
    </div>
  )
}
