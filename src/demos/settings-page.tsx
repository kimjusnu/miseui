import { SettingsPage, type SettingsPageVariant } from "@/registry/miseui/blocks/settings-page"

export function Demo({ variant }: { variant?: string }) {
  return <SettingsPage variant={variant as SettingsPageVariant | undefined} />
}
