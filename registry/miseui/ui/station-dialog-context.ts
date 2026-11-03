import { createContext, useContext } from "react"

export type StationDialogVariant = "card" | "side" | "pin"
export type StationDialogEffect = "morph"

interface StationDialogContextValue {
  value: string | null
  variant: StationDialogVariant
  effect: StationDialogEffect | undefined
  origin: HTMLElement | null
  choose: (next: string | null, element?: HTMLElement) => void
}

export const StationDialogContext = createContext<StationDialogContextValue | null>(null)

export function useStationDialog() {
  const context = useContext(StationDialogContext)
  if (!context) throw new Error("StationDialog parts must be used inside <StationDialog>")
  return context
}
