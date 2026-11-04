import { CtaSection, type CtaSectionVariant } from "@/registry/miseui/blocks/cta-section"

export function Demo({ variant }: { variant?: string }) {
  return <CtaSection variant={variant as CtaSectionVariant | undefined} />
}
