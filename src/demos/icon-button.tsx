import { useEffect, useRef, useState } from "react"
import { Bookmark, Heart, Pencil, Plus, Share2, Trash2 } from "lucide-react"
import { IconButton, type IconButtonSize, type IconButtonVariant } from "@/registry/miseui/ui/icon-button"

const VARIANTS: readonly IconButtonVariant[] = ["ghost", "outline", "solid", "soft"]
const SIZES: readonly IconButtonSize[] = ["sm", "md", "lg"]
const SAVE_MS = 1400

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

function SaveButton() {
  const [pending, setPending] = useState(false)
  const [saved, setSaved] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <>
      <IconButton
        label={saved ? "Remove bookmark" : "Bookmark"}
        pendingLabel="Saving"
        pending={pending}
        variant="outline"
        aria-pressed={saved}
        onClick={() => {
          setPending(true)
          timer.current = window.setTimeout(() => {
            setPending(false)
            setSaved((value) => !value)
          }, SAVE_MS)
        }}
      >
        <Bookmark className={saved ? "fill-current" : undefined} />
      </IconButton>
      <span role="status" className="min-w-0 text-[13px] text-muted-foreground">
        {pending ? "Saving" : saved ? "Saved" : "Not saved"}
      </span>
    </>
  )
}

function LikeButton() {
  const [count, setCount] = useState(24)
  return (
    <>
      <IconButton label="Like" variant="soft" effect="press" onClick={() => setCount((value) => value + 1)}>
        <Heart />
      </IconButton>
      <span className="text-[13px] text-muted-foreground tabular-nums">{count} likes</span>
    </>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          {SIZES.map((size) => (
            <IconButton key={size} label={`Add, ${size}`} variant={variant} size={size}>
              <Plus />
            </IconButton>
          ))}
        </Cell>
      ))}
      <Cell label="pending keeps focus">
        <SaveButton />
      </Cell>
      <Cell label="press effect">
        <LikeButton />
      </Cell>
      <Cell label="optional tooltip">
        <IconButton label="Edit" tooltip>
          <Pencil />
        </IconButton>
        <IconButton label="Share" tooltip>
          <Share2 />
        </IconButton>
        <IconButton label="Delete" tooltip="Moves to the bin for 30 days">
          <Trash2 />
        </IconButton>
      </Cell>
      <Cell label="disabled">
        <IconButton label="Delete" variant="outline" disabled>
          <Trash2 />
        </IconButton>
        <IconButton label="Add" variant="solid" disabled>
          <Plus />
        </IconButton>
      </Cell>
    </div>
  )
}
