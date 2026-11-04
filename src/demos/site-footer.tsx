import { SiteFooter, type SiteFooterVariant } from "@/registry/miseui/blocks/site-footer"

export function Demo({ variant }: { variant?: string }) {
  return <SiteFooter variant={variant as SiteFooterVariant | undefined} />
}
