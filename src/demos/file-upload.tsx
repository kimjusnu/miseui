import { useEffect, useRef, useState } from "react"
import { FileUpload, type FileUploadItem, type FileUploadProps } from "@/registry/miseui/ui/file-upload"

const MB = 1024 * 1024
const TICK_MS = 400
const STEP = 25

const SAMPLE: readonly FileUploadItem[] = [
  { id: "contract", name: "signed-contract.pdf", size: 2.4 * MB, status: "done" },
  { id: "invoice", name: "invoice-october.pdf", size: 310 * 1024, status: "uploading", progress: 60 },
  { id: "scan", name: "passport-scan.png", size: 4.8 * MB, status: "error", error: "Connection lost. Try again." },
]

/** Stands in for your upload code: it only moves numbers, nothing leaves the browser. */
function useFakeUploads(initial: readonly FileUploadItem[] = []) {
  const [items, setItems] = useState(initial)
  const nextId = useRef(0)
  const uploading = items.some((item) => item.status === "uploading")
  useEffect(() => {
    if (!uploading) return
    const timer = setInterval(() => {
      setItems((rows) =>
        rows.map((row) => {
          if (row.status !== "uploading") return row
          const progress = (row.progress ?? 0) + STEP
          return progress >= 100 ? { ...row, progress: 100, status: "done" } : { ...row, progress }
        }),
      )
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [uploading])
  const add = (files: readonly File[], withPreview = false) => {
    const rows = files.map((file): FileUploadItem => {
      nextId.current += 1
      return {
        id: `${file.name}-${nextId.current}`,
        name: file.name,
        size: file.size,
        status: "uploading",
        progress: 0,
        previewUrl: withPreview ? URL.createObjectURL(file) : undefined,
      }
    })
    setItems((current) => (withPreview ? rows : [...current, ...rows]))
  }
  const remove = (id: string) => setItems((rows) => rows.filter((row) => row.id !== id))
  const retry = (id: string) =>
    setItems((rows) => rows.map((row) => (row.id === id ? { ...row, status: "uploading", progress: 0, error: undefined } : row)))
  return { items, add, remove, retry }
}

function Live({ initial, ...props }: Partial<FileUploadProps> & { initial?: readonly FileUploadItem[] }) {
  const { items, add, remove, retry } = useFakeUploads(initial)
  return <FileUpload {...props} items={items} onFilesAccepted={(files) => add(files)} onRemove={remove} onRetry={retry} />
}

function LiveAvatar() {
  const { items, add, remove } = useFakeUploads()
  return (
    <FileUpload
      variant="avatar"
      accept="image/*"
      maxSize={2 * MB}
      label="Profile photo"
      hint="JPG or PNG, up to 2 MB"
      items={items}
      onFilesAccepted={(files) => add(files, true)}
      onRemove={remove}
      labels={{ remove: () => "Remove photo" }}
    />
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">dropzone, materialize effect</p>
        <Live effect="materialize" multiple maxFiles={5} maxSize={5 * MB} hint="Up to five files, 5 MB each" initial={SAMPLE} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">button</p>
        <Live variant="button" label="Attach receipt" accept="image/*,.pdf" maxSize={MB} hint="Image or PDF, 1 MB" multiple />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">compact, in a form</p>
        <Live variant="compact" hint="No file chosen" accept=".pdf" initial={SAMPLE.slice(0, 1)} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">avatar</p>
        <LiveAvatar />
      </div>
    </div>
  )
}
