import { useState } from "react"
import { Tag, type TagProps, type TagTone, type TagVariant } from "@/registry/miseui/ui/tag"

const TONES: readonly { tone: TagTone; word: string }[] = [
  { tone: "neutral", word: "Draft" },
  { tone: "accent", word: "New" },
  { tone: "success", word: "Paid" },
  { tone: "warning", word: "Pending" },
  { tone: "error", word: "Overdue" },
]
const VARIANTS: readonly TagVariant[] = ["soft", "outline", "solid", "dot"]
const TOPICS = ["Design", "Research", "Copywriting", "Motion"] as const

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function Filters() {
  const [active, setActive] = useState<readonly string[]>(["Design"])
  const toggle = (topic: string) =>
    setActive((list) => (list.includes(topic) ? list.filter((entry) => entry !== topic) : [...list, topic]))
  return TOPICS.map((topic) => (
    <Tag
      key={topic}
      variant={active.includes(topic) ? "solid" : "outline"}
      pressed={active.includes(topic)}
      onClick={() => toggle(topic)}
    >
      {topic}
    </Tag>
  ))
}

function Removable(props: Partial<TagProps>) {
  const [topics, setTopics] = useState<readonly string[]>(TOPICS)
  if (topics.length === 0) {
    return (
      <button type="button" className="h-6 text-[13px] underline underline-offset-4" onClick={() => setTopics(TOPICS)}>
        Bring them back
      </button>
    )
  }
  return topics.map((topic) => (
    <Tag
      key={topic}
      removeLabel={`Remove ${topic}`}
      onRemove={() => setTopics((list) => list.filter((entry) => entry !== topic))}
      {...props}
    >
      {topic}
    </Tag>
  ))
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          {TONES.map(({ tone, word }) => (
            <Tag key={tone} variant={variant} tone={tone}>
              {word}
            </Tag>
          ))}
        </Cell>
      ))}
      <Cell label="clickable, as filters">
        <Filters />
      </Cell>
      <Cell label="removable">
        <Removable />
      </Cell>
      <Cell label="collapse effect, soft">
        <Removable effect="collapse" />
      </Cell>
      <Cell label="collapse effect, outline">
        <Removable effect="collapse" variant="outline" />
      </Cell>
    </div>
  )
}
