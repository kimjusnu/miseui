import { Rating } from "@/registry/miseui/ui/rating"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="stars">
        <Rating aria-label="Rate this course" defaultValue={4} />
      </Cell>
      <Cell label="hearts">
        <Rating variant="hearts" aria-label="How much did you like this recipe?" defaultValue={3} />
      </Cell>
      <Cell label="numeric">
        <Rating variant="numeric" aria-label="How satisfied are you with support?" defaultValue={4} />
      </Cell>
      <Cell label="bar">
        <Rating variant="bar" aria-label="Rate the difficulty" defaultValue={3} />
      </Cell>
      <Cell label="half steps">
        <Rating aria-label="Rate this hotel" step={0.5} defaultValue={3.5} />
      </Cell>
      <Cell label="pop effect">
        <Rating aria-label="Rate this course" effect="pop" />
      </Cell>
      <Cell label="numeric out of 10, pop effect">
        <Rating variant="numeric" max={10} effect="pop" aria-label="How likely are you to recommend us?" />
      </Cell>
      <Cell label="read-only average">
        <Rating aria-label="Average of 218 reviews" readOnly value={4.5} />
      </Cell>
      <Cell label="disabled">
        <Rating variant="bar" aria-label="Rate the difficulty" disabled defaultValue={2} />
      </Cell>
    </div>
  )
}
