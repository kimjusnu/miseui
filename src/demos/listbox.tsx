import { CreditCard, Landmark, Wallet } from "lucide-react"
import { Listbox, type ListboxOption } from "@/registry/miseui/ui/listbox"

const ROLES: readonly ListboxOption[] = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "billing", label: "Billing", disabled: true },
]

const COLUMNS: readonly ListboxOption[] = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "team", label: "Team" },
  { value: "joined", label: "Joined" },
  { value: "last", label: "Last active" },
]

const PAYMENT: readonly ListboxOption[] = [
  { value: "card", label: "Card", description: "Charged today", icon: <CreditCard /> },
  { value: "bank", label: "Bank transfer", description: "Takes two working days", icon: <Landmark /> },
  { value: "balance", label: "Account balance", description: "Nothing left to pay", icon: <Wallet /> },
]

const ZONES: readonly ListboxOption[] = [
  { value: "seoul", label: "Seoul", group: "Asia" },
  { value: "tokyo", label: "Tokyo", group: "Asia" },
  { value: "singapore", label: "Singapore", group: "Asia" },
  { value: "berlin", label: "Berlin", group: "Europe" },
  { value: "lisbon", label: "Lisbon", group: "Europe" },
  { value: "oslo", label: "Oslo", group: "Europe" },
]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">plain, spring effect</p>
        <Listbox aria-label="Role" options={ROLES} defaultValue="editor" effect="spring" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">check, several at once</p>
        <Listbox aria-label="Visible columns" options={COLUMNS} variant="check" multiple defaultValue={["name", "team"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">card, spring effect</p>
        <Listbox aria-label="Payment method" options={PAYMENT} variant="card" effect="spring" defaultValue="card" />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">compact, grouped, type a letter to jump</p>
        <Listbox aria-label="Time zone" options={ZONES} variant="compact" defaultValue="seoul" className="max-h-56" />
      </div>
    </div>
  )
}
