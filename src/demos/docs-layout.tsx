import { DocsLayout, type DocsLayoutVariant } from "@/registry/miseui/blocks/docs-layout"

export function Demo({ variant }: { variant?: string }) {
  return <DocsLayout variant={variant as DocsLayoutVariant | undefined} />
}
