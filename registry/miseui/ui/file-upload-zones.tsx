import type * as React from "react"
import { Camera, Paperclip, Upload, X } from "lucide-react"
import { clampPercent, type FileUploadItem, type FileUploadLabels } from "@/registry/miseui/ui/file-upload-row"
import { cn } from "@/registry/miseui/lib/utils"

interface ZoneProps {
  /** The real file input. It stays in the label, so a click, Enter and Space all work with no script. */
  input: React.ReactNode
  dragging: boolean
  disabled: boolean
  label: string
  hint?: string
  dragHandlers: Pick<React.ComponentProps<"label">, "onDragEnter" | "onDragOver" | "onDragLeave" | "onDrop">
}

/** The ring follows the hidden input, because that is what actually holds keyboard focus. */
const FOCUS_RING_CLASS = "focus-within:ring-[3px] focus-within:ring-ring/50"
const DISABLED_CLASS = "has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50"

function DropzoneArea({ input, dragging, label, hint, dragHandlers }: ZoneProps) {
  return (
    <label
      data-slot="file-upload-zone"
      data-dragging={dragging ? "true" : undefined}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent/50",
        dragging && "border-solid border-foreground bg-accent",
        FOCUS_RING_CLASS,
        DISABLED_CLASS,
      )}
      {...dragHandlers}
    >
      {input}
      <Upload aria-hidden="true" className="size-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
      {hint ? <span className="text-[13px] text-muted-foreground">{hint}</span> : null}
    </label>
  )
}

function ButtonArea({ input, dragging, label, hint, dragHandlers }: ZoneProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <label
        data-slot="file-upload-zone"
        data-dragging={dragging ? "true" : undefined}
        className={cn(
          "inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm font-medium shadow-xs pointer-coarse:h-10",
          "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent",
          dragging && "border-foreground bg-accent",
          FOCUS_RING_CLASS,
          DISABLED_CLASS,
        )}
        {...dragHandlers}
      >
        {input}
        <Upload aria-hidden="true" className="size-4" />
        {label}
      </label>
      {hint ? <span className="text-[13px] text-muted-foreground">{hint}</span> : null}
    </div>
  )
}

function CompactArea({ input, dragging, label, hint, dragHandlers }: ZoneProps) {
  return (
    <label
      data-slot="file-upload-zone"
      data-dragging={dragging ? "true" : undefined}
      className={cn(
        "flex h-9 min-w-0 cursor-pointer items-center gap-2 rounded-md border border-input px-3 shadow-xs pointer-coarse:h-10",
        "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent/50",
        dragging && "border-foreground bg-accent",
        FOCUS_RING_CLASS,
        DISABLED_CLASS,
      )}
      {...dragHandlers}
    >
      {input}
      <Paperclip aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      {hint ? <span className="truncate text-sm text-muted-foreground">{hint}</span> : null}
      <span className="ml-auto shrink-0 text-[13px] font-medium">{label}</span>
    </label>
  )
}

const RING_RADIUS = 46
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function AvatarProgress({ item, label }: { item: FileUploadItem; label: string }) {
  const percent = clampPercent(item.progress ?? 0)
  return (
    <svg
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={item.progress === undefined ? undefined : Math.round(percent)}
      viewBox="0 0 100 100"
      className="pointer-events-none absolute inset-0 -rotate-90"
    >
      <circle cx="50" cy="50" r={RING_RADIUS} fill="none" strokeWidth="4" className="stroke-background/70" />
      <circle
        cx="50"
        cy="50"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        strokeDashoffset={RING_LENGTH * (1 - percent / 100)}
        className="stroke-mise transition-[stroke-dashoffset] duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none"
      />
    </svg>
  )
}

type AvatarAreaProps = ZoneProps & {
  item?: FileUploadItem
  labels: FileUploadLabels
  onRemove?: (id: string) => void
}

function AvatarArea({ input, dragging, label, hint, dragHandlers, item, labels, onRemove, disabled }: AvatarAreaProps) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <label
        data-slot="file-upload-zone"
        data-dragging={dragging ? "true" : undefined}
        className={cn(
          "group/avatar relative block size-24 shrink-0 cursor-pointer overflow-hidden rounded-full bg-muted",
          dragging && "ring-2 ring-foreground",
          FOCUS_RING_CLASS,
          DISABLED_CLASS,
        )}
        {...dragHandlers}
      >
        {input}
        {item?.previewUrl ? <img src={item.previewUrl} alt="" className="size-full object-cover" /> : null}
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-colors duration-(--duration-fast) ease-(--ease-mise)",
            item?.previewUrl ? "text-transparent group-hover/avatar:bg-black/40 group-hover/avatar:text-white" : "text-muted-foreground",
          )}
        >
          <Camera className="size-4" />
        </span>
        {item?.status === "uploading" ? <AvatarProgress item={item} label={labels.uploading(item.name)} /> : null}
      </label>
      <div className="grid min-w-0 justify-items-start gap-1">
        <span className="text-sm font-medium">{label}</span>
        {item?.status === "error" ? (
          <span className="text-[13px] text-destructive">{item.error ?? labels.failed}</span>
        ) : hint ? (
          <span className="text-[13px] text-muted-foreground">{hint}</span>
        ) : null}
        {item && onRemove ? (
          <button
            type="button"
            disabled={disabled}
            className="-ml-2 inline-flex h-8 items-center gap-1 rounded-md px-2 text-[13px] text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10"
            onClick={() => onRemove(item.id)}
          >
            <X aria-hidden="true" className="size-4" />
            {labels.remove(item.name)}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export { AvatarArea, ButtonArea, CompactArea, DropzoneArea, type ZoneProps }
