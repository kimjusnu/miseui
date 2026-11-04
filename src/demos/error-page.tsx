import { ErrorPage, type ErrorPageCode, type ErrorPageVariant } from "@/registry/miseui/blocks/error-page"

const RETRY_DELAY_MS = 900

/** The preview has one switch, so each design shows a different code. ?code= picks another one when reviewing. */
const CODE_FOR_DESIGN: Record<string, ErrorPageCode> = { centered: "404", split: "500", terminal: "offline" }

/** Stands in for a real refetch, which would otherwise reload this whole documentation page. */
function previewRetry() {
  return new Promise<void>((_, reject) => {
    window.setTimeout(() => reject(new Error("Example only")), RETRY_DELAY_MS)
  })
}

function readCode(variant: string | undefined): ErrorPageCode {
  const asked = new URLSearchParams(window.location.search).get("code")
  if (asked === "404" || asked === "500" || asked === "offline") return asked
  return Object.hasOwn(CODE_FOR_DESIGN, variant ?? "") ? CODE_FOR_DESIGN[variant ?? ""] : "404"
}

export function Demo({ variant }: { variant?: string }) {
  const code = readCode(variant)
  return <ErrorPage variant={variant as ErrorPageVariant | undefined} code={code} reference={code === "500" ? "req_example_7f3a" : undefined} onRetry={previewRetry} />
}
