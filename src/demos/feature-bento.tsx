import { FeatureBento, type FeatureBentoVariant } from "@/registry/miseui/blocks/feature-bento"

export function Demo({ variant }: { variant?: string }) {
  return <FeatureBento variant={variant as FeatureBentoVariant} />
}
