import { FaqSection, type FaqSectionVariant } from "@/registry/miseui/blocks/faq-section"

export function Demo({ variant }: { variant?: string }) {
  return <FaqSection variant={variant as FaqSectionVariant | undefined} />
}
