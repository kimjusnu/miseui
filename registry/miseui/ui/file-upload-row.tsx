import { AlertCircle, Check, File as FileIcon, RotateCcw, X } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { formatBytes } from "@/registry/miseui/ui/file-upload-math"
import { cn } from "@/registry/miseui/lib/utils"

type FileStatus = "queued" | "uploading" | "done" | "error"

interface FileUploadItem {
  id: string
  name: string
  /** Bytes. */
  size: number
  status?: FileStatus
  /** 0 to 100. Leave it out while the size of the job is unknown. */
  progress?: number
  /** The sentence to show when `status` is `error`. */
  error?: string
  /** An image to show in the `avatar` variant. */
  previewUrl?: string
}

interface FileUploadLabels {
  remove: (name: string) => string
  retry: (name: string) => string
  uploading: (name: string) => string
  queued: string
  done: string
  failed: string
}

const ICON_BUTTON_CLASS = cn(
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none pointer-coarse:size-10",
  "transition-colors duration-(--duration-fast) ease-(--ease-mise) hover:bg-accent hover:text-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4",
)

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

function statusText(item: FileUploadItem, labels: FileUploadLabels) {
  if (item.status === "error") return item.error ?? labels.failed
  if (item.status === "done") return labels.done
  if (item.status === "queued") return labels.queued
  return item.status === "uploading" && item.progress !== undefined ? `${Math.round(clampPercent(item.progress))}%` : ""
}

function StatusIcon({ status }: { status?: FileStatus }) {
  // Fixed hues: success and failure must read the same when the accent is itself green or red.
  if (status === "done") return <Check aria-hidden="true" className="size-4 text-emerald-600 dark:text-emerald-400" />
  if (status === "error") return <AlertCircle aria-hidden="true" className="size-4 text-destructive" />
  return <FileIcon aria-hidden="true" className="size-4 text-muted-foreground" />
}

function ProgressLine({ item, label }: { item: FileUploadItem; label: string }) {
  const known = item.progress !== undefined
  const percent = clampPercent(item.progress ?? 0)
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={known ? Math.round(percent) : undefined}
      className="mt-1 h-0.5 overflow-hidden rounded-full bg-muted"
    >
      <div
        className={cn(
          "h-full origin-left rounded-full bg-mise transition-transform duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none",
          !known && "w-1/3 motion-safe:animate-pulse",
        )}
        style={known ? { transform: `scaleX(${percent / 100})` } : undefined}
      />
    </div>
  )
}

interface FileRowProps {
  item: FileUploadItem
  compact: boolean
  disabled: boolean
  labels: FileUploadLabels
  onRemove?: (id: string) => void
  onRetry?: (id: string) => void
}

function FileRow({ item, compact, disabled, labels, onRemove, onRetry }: FileRowProps) {
  const failed = item.status === "error"
  const status = statusText(item, labels)
  const detail = failed ? status : [compact ? "" : formatBytes(item.size), status].filter(Boolean).join(", ")
  return (
    <div className={cn("flex min-w-0 items-center gap-2", compact ? "min-h-8 py-1" : "rounded-md border px-3 py-2")}>
      <StatusIcon status={item.status} />
      <div className="min-w-0 flex-1">
        <p className={cn("truncate", compact ? "text-[13px]" : "text-sm")} title={item.name}>{item.name}</p>
        {detail ? <p className={cn("text-[13px] break-words", failed ? "text-destructive" : "text-muted-foreground")}>{detail}</p> : null}
        {item.status === "uploading" && !compact ? <ProgressLine item={item} label={labels.uploading(item.name)} /> : null}
      </div>
      {failed && onRetry ? (
        <button type="button" aria-label={labels.retry(item.name)} disabled={disabled} className={ICON_BUTTON_CLASS} onClick={() => onRetry(item.id)}>
          <RotateCcw aria-hidden="true" />
        </button>
      ) : null}
      {onRemove ? (
        <button type="button" aria-label={labels.remove(item.name)} disabled={disabled} className={ICON_BUTTON_CLASS} onClick={() => onRemove(item.id)}>
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )
}

type FileListProps = Omit<FileRowProps, "item"> & {
  items: readonly FileUploadItem[]
  materialize: boolean
}

const ROW_HIDDEN = { opacity: 0, height: 0, scale: 0.96, filter: "blur(4px)" }
const ROW_SHOWN = { opacity: 1, height: "auto", scale: 1, filter: "blur(0px)" }

function FileList({ items, materialize, ...row }: FileListProps) {
  const reduceMotion = useReducedMotion() ?? false
  if (items.length === 0) return null
  const listClass = row.compact ? "grid min-w-0 divide-y" : "grid min-w-0 gap-2"
  if (!materialize || reduceMotion) {
    return (
      <ul data-slot="file-upload-list" className={listClass}>
        {items.map((item) => <li key={item.id} data-slot="file-upload-row" className="min-w-0"><FileRow item={item} {...row} /></li>)}
      </ul>
    )
  }
  return (
    <ul data-slot="file-upload-list" className={listClass}>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            data-slot="file-upload-row"
            className="min-w-0 overflow-hidden"
            initial={ROW_HIDDEN}
            animate={ROW_SHOWN}
            exit={ROW_HIDDEN}
            transition={SPRING_DEFAULT}
          >
            <FileRow item={item} {...row} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

export { FileList, clampPercent, type FileStatus, type FileUploadItem, type FileUploadLabels }
