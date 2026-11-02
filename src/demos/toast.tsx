import { useRef } from "react"
import { Button } from "@/registry/miseui/ui/button"
import { Toaster, toast, type ToastEffect, type ToastPosition, type ToastVariant } from "@/registry/miseui/ui/toast"

const UPLOAD_MS = 1800

function waitForUpload(shouldFail: boolean) {
  return new Promise<string>((resolve, reject) => {
    setTimeout(() => (shouldFail ? reject(new Error("offline")) : resolve("report.pdf")), UPLOAD_MS)
  })
}

interface PreviewProps {
  id: string
  label: string
  variant: ToastVariant
  effect?: ToastEffect
  position?: ToastPosition
}

function Preview({ id, label, variant, effect, position }: PreviewProps) {
  const uploads = useRef(0)
  const startUpload = () => {
    uploads.current += 1
    toast
      .promise(
        waitForUpload(uploads.current % 2 === 0),
        { loading: "Uploading report.pdf", success: (name) => `${name} uploaded`, error: "Upload failed, try again" },
        { toaster: id },
      )
      .catch(() => {})
  }
  return (
    <div className="grid min-w-0 gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="relative isolate h-56 overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast("Draft saved", { toaster: id, description: "All changes are on the server." })}
          >
            Neutral
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.success("Invoice sent", { toaster: id })}>
            Success
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast.error("Payment failed", {
                toaster: id,
                description: "The card was declined.",
                action: { label: "Retry", onClick: () => toast.success("Payment retried", { toaster: id }) },
              })
            }
          >
            Error
          </Button>
          <Button size="sm" variant="outline" onClick={startUpload}>
            Upload
          </Button>
        </div>
        <Toaster id={id} aria-label={`${label} notifications`} variant={variant} effect={effect} position={position} contained />
      </div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Preview id="demo-stack" label="stack, hover the deck" variant="stack" />
      <Preview id="demo-list" label="list" variant="list" />
      <Preview id="demo-pill" label="pill" variant="pill" />
      <Preview id="demo-bar" label="bar" variant="bar" />
      <Preview id="demo-spring" label="spring effect, swipe to dismiss" variant="list" effect="spring" />
      <Preview id="demo-spring-stack" label="spring effect on stack" variant="stack" effect="spring" position="top-center" />
    </div>
  )
}
