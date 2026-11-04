import { SettingsCardsView } from "./settings-page-cards"
import type { SettingsSection, SettingsValues, SettingsViewProps } from "./settings-page-form"
import { SettingsSectionsView } from "./settings-page-sections"
import { SettingsSidebarView } from "./settings-page-sidebar"

type SettingsPageVariant = "sections" | "sidebar" | "cards"

interface SettingsPageProps extends SettingsViewProps {
  /** `sections` one long page with one save bar, `sidebar` one section at a time beside a side nav, `cards` each group its own plate with its own Save. Anything else is `sections`. */
  variant?: SettingsPageVariant
}

function SettingsPage({ variant, ...props }: SettingsPageProps) {
  if (variant === "sidebar") return <SettingsSidebarView {...props} />
  if (variant === "cards") return <SettingsCardsView {...props} />
  return <SettingsSectionsView {...props} />
}

export { SettingsPage, type SettingsPageProps, type SettingsPageVariant, type SettingsSection, type SettingsValues }
