import { LandingHero, type LandingHeroVariant } from "@/registry/miseui/blocks/landing-hero"

export function Demo({ variant }: { variant?: string }) {
  return <LandingHero variant={variant as LandingHeroVariant} />
}
