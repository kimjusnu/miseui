import { BeforeAfter, type BeforeAfterEffect, type BeforeAfterVariant } from "@/registry/miseui/ui/before-after"

/** A drawn photograph, so the demo needs no remote image. Its colours are the picture's own, not the theme's. */
function Valley({ graded }: { graded: boolean }) {
  return (
    <svg
      viewBox="0 0 320 200"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={graded ? "size-full" : "size-full brightness-105 contrast-75 grayscale"}
    >
      <rect width="320" height="200" fill="#f7c59f" />
      <circle cx="232" cy="66" r="26" fill="#fff1d6" />
      <path d="M0 118 60 74l52 38 58-56 74 62 76-34v116H0Z" fill="#7a8fb3" />
      <path d="M0 146 72 104l70 40 62-30 116 50v36H0Z" fill="#3f6f73" />
      <path d="M0 172 96 138l88 34 136-22v50H0Z" fill="#23403f" />
    </svg>
  )
}

const SHOWN: ReadonlyArray<{ title: string; variant: BeforeAfterVariant; effect?: BeforeAfterEffect; value?: number }> = [
  { title: "split", variant: "split" },
  { title: "curtain", variant: "curtain" },
  { title: "lens, move the pointer over it", variant: "lens", value: 62 },
  { title: "sweep effect, moves once when it comes into view", variant: "split", effect: "sweep" },
]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {SHOWN.map(({ title, variant, effect, value }) => (
        <div key={title} className="grid min-w-0 content-start gap-2">
          <p className="text-xs text-muted-foreground">{title}</p>
          <BeforeAfter
            label={`Compare the raw photo with the graded one, ${title}`}
            before={<Valley graded={false} />}
            after={<Valley graded />}
            beforeLabel="Raw"
            afterLabel="Graded"
            variant={variant}
            effect={effect}
            defaultValue={value}
          />
        </div>
      ))}
    </div>
  )
}
