import { LogoWall, placeholderLogos, type LogoWallVariant } from "@/registry/miseui/blocks/logo-wall"

const LOGOS = placeholderLogos(8)

export function Demo({ variant }: { variant?: string }) {
  return (
    <LogoWall
      variant={variant as LogoWallVariant | undefined}
      logos={LOGOS}
      title="Placeholder marks."
      titleQuiet="Use only logos you have permission to show."
    />
  )
}
