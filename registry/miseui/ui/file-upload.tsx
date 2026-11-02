import type * as React from "react"
import { useState } from "react"
import {
  DEFAULT_MESSAGES,
  uniqueMessages,
  validateFiles,
  type FileMessages,
  type FileRejection,
} from "@/registry/miseui/ui/file-upload-math"
import { FileList, type FileUploadItem, type FileUploadLabels } from "@/registry/miseui/ui/file-upload-row"
import { AvatarArea, ButtonArea, CompactArea, DropzoneArea } from "@/registry/miseui/ui/file-upload-zones"
import { cn } from "@/registry/miseui/lib/utils"

type FileUploadVariant = "dropzone" | "button" | "compact" | "avatar"
type FileUploadEffect = "materialize"

const DEFAULT_LABELS: FileUploadLabels = {
  remove: (name) => `Remove ${name}`,
  retry: (name) => `Retry ${name}`,
  uploading: (name) => `Uploading ${name}`,
  queued: "Waiting",
  done: "Uploaded",
  failed: "Upload failed",
}

const DEFAULT_ACTION: Record<FileUploadVariant, string> = {
  dropzone: "Drop files here, or browse",
  button: "Choose files",
  compact: "Browse",
  avatar: "Change photo",
}

type RootAttributes = Omit<React.ComponentProps<"div">, "children" | "onDrop" | "defaultValue">

interface FileUploadProps extends RootAttributes {
  /** `dropzone` a large target, `button` one action, `compact` a form field, `avatar` a round picture. */
  variant?: FileUploadVariant
  /** `materialize` lets rows arrive and leave with scale, blur and height together. */
  effect?: FileUploadEffect
  /** What you are tracking. This component never touches the network: you upload and pass the state back. */
  items?: readonly FileUploadItem[]
  /** Files that passed the limits. Start your uploads here. */
  onFilesAccepted?: (files: File[]) => void
  onFilesRejected?: (rejections: FileRejection[]) => void
  onRemove?: (id: string) => void
  onRetry?: (id: string) => void
  /** The same syntax as the input's accept attribute. */
  accept?: string
  /** Bytes. */
  maxSize?: number
  /** Total, counting what is already in `items`. `avatar` is always one. */
  maxFiles?: number
  multiple?: boolean
  disabled?: boolean
  /** Names the input and is the visible action. */
  label?: string
  /** The limits in words: "PNG or PDF, up to 5 MB". */
  hint?: string
  labels?: Partial<FileUploadLabels>
  messages?: Partial<FileMessages>
}

type IntakeOptions = Pick<FileUploadProps, "onFilesAccepted" | "onFilesRejected" | "accept" | "maxSize" | "maxFiles" | "messages"> & {
  disabled: boolean
  avatar: boolean
  itemCount: number
}

function useFileIntake({ onFilesAccepted, onFilesRejected, accept, maxSize, maxFiles, messages, disabled, avatar, itemCount }: IntakeOptions) {
  const [dragging, setDragging] = useState(false)
  const [errors, setErrors] = useState<readonly string[]>([])
  const receive = (files: readonly File[]) => {
    if (disabled || files.length === 0) return
    // An avatar replaces what is there, so the one in the list does not count against the limit.
    const limits = { accept, maxSize, maxFiles: avatar ? 1 : maxFiles, existing: avatar ? 0 : itemCount }
    const { accepted, rejected } = validateFiles(files, limits, { ...DEFAULT_MESSAGES, ...messages })
    setErrors(uniqueMessages(rejected))
    if (rejected.length) onFilesRejected?.([...rejected])
    if (accepted.length) onFilesAccepted?.([...accepted])
  }
  const dragHandlers: React.ComponentProps<"label"> = {
    onDragEnter: (event) => {
      event.preventDefault()
      if (!disabled) setDragging(true)
    },
    // Without preventDefault here the browser opens the dropped file and leaves the page.
    onDragOver: (event) => event.preventDefault(),
    onDragLeave: (event) => {
      // Moving onto a child also fires dragleave; only leaving the zone itself counts.
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false)
    },
    onDrop: (event) => {
      event.preventDefault()
      setDragging(false)
      receive(Array.from(event.dataTransfer.files))
    },
  }
  return { dragging, errors, receive, dragHandlers }
}

function FileUpload({
  variant = "dropzone", effect, items = [], onFilesAccepted, onFilesRejected, onRemove, onRetry, accept, maxSize, maxFiles,
  multiple, disabled = false, label, hint, labels, messages, className, ...props
}: FileUploadProps) {
  const avatar = variant === "avatar"
  const mergedLabels = { ...DEFAULT_LABELS, ...labels }
  const action = label ?? DEFAULT_ACTION[variant]
  const { dragging, errors, receive, dragHandlers } = useFileIntake({
    onFilesAccepted, onFilesRejected, accept, maxSize, maxFiles, messages, disabled, avatar, itemCount: items.length,
  })
  const input = (
    <input
      type="file"
      data-slot="file-upload-input"
      aria-label={action}
      accept={accept}
      multiple={avatar ? false : multiple}
      disabled={disabled}
      className="sr-only"
      onChange={(event) => {
        receive(Array.from(event.target.files ?? []))
        // Cleared so choosing the same file again, after removing it, still fires change.
        event.target.value = ""
      }}
    />
  )
  const zone = { input, dragging, disabled, label: action, hint, dragHandlers }
  return (
    <div data-slot="file-upload" data-variant={variant} data-effect={effect} className={cn("grid w-full min-w-0 gap-3", className)} {...props}>
      {variant === "dropzone" ? <DropzoneArea {...zone} /> : null}
      {variant === "button" ? <ButtonArea {...zone} /> : null}
      {variant === "compact" ? <CompactArea {...zone} /> : null}
      {avatar ? <AvatarArea {...zone} item={items[0]} labels={mergedLabels} onRemove={onRemove} /> : null}
      {errors.length ? (
        <ul role="alert" data-slot="file-upload-errors" className="grid gap-1 text-[13px] text-destructive">
          {errors.map((error) => <li key={error} className="break-words">{error}</li>)}
        </ul>
      ) : null}
      {avatar ? null : (
        <FileList items={items} materialize={effect === "materialize"} compact={variant === "compact"} disabled={disabled} labels={mergedLabels} onRemove={onRemove} onRetry={onRetry} />
      )}
    </div>
  )
}

export {
  FileUpload,
  type FileUploadProps,
  type FileUploadItem,
  type FileUploadLabels,
  type FileUploadVariant,
  type FileUploadEffect,
  type FileRejection,
  type FileMessages,
}
