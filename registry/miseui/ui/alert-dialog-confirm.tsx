import type * as React from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { matchesConfirmation, type AlertDialogEffect, type AlertDialogTone, type AlertDialogVariant } from "@/registry/miseui/ui/alert-dialog-classes"
import { Input } from "@/registry/miseui/ui/input"
import { cn } from "@/registry/miseui/lib/utils"

interface RootContextValue {
  variant: AlertDialogVariant
  effect: AlertDialogEffect | undefined
  tone: AlertDialogTone
  confirmWord: string | undefined
}

const RootContext = createContext<RootContextValue>({ variant: "plain", effect: undefined, tone: "neutral", confirmWord: undefined })

interface ConfirmContextValue {
  typed: string
  setTyped: (value: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

/**
 * Rendered inside the Radix content because that is the part that unmounts on close; a wrapper around it stays
 * mounted, and a reopened dialog would start already unlocked.
 */
function ConfirmScope({ inputRef, children }: { inputRef: React.RefObject<HTMLInputElement | null>; children: React.ReactNode }) {
  const [typed, setTyped] = useState("")
  const confirm = useMemo(() => ({ typed, setTyped, inputRef }), [typed, inputRef])
  return <ConfirmContext.Provider value={confirm}>{children}</ConfirmContext.Provider>
}

type AlertDialogConfirmFieldProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "ref"> & {
  /** Replaces the sentence above the field. */
  label?: React.ReactNode
}

/** The field of the `typed` variant. Enter runs the action once the word matches. */
function AlertDialogConfirmField({ label, className, onKeyDown, ...props }: AlertDialogConfirmFieldProps) {
  const { confirmWord = "" } = useContext(RootContext)
  const confirm = useContext(ConfirmContext)
  const id = useId()
  return (
    <div data-slot="alert-dialog-confirm" className={cn("grid gap-2", className)}>
      <label htmlFor={id} className="text-[13px] leading-5 text-muted-foreground">
        {label ?? (
          <>
            Type <strong className="font-medium break-all text-foreground select-all">{confirmWord}</strong> to confirm
          </>
        )}
      </label>
      <Input
        id={id}
        ref={confirm?.inputRef}
        value={confirm?.typed ?? ""}
        // A phone keyboard would capitalise the first letter and the word would never match.
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        className="pointer-coarse:h-10"
        onChange={(event) => confirm?.setTyped(event.target.value)}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.key !== "Enter" || !matchesConfirmation(confirm?.typed ?? "", confirmWord)) return
          event.preventDefault()
          event.currentTarget.closest("[role='alertdialog']")?.querySelector<HTMLButtonElement>("[data-slot='alert-dialog-action']")?.click()
        }}
        {...props}
      />
    </div>
  )
}

export { AlertDialogConfirmField, ConfirmContext, ConfirmScope, RootContext, type AlertDialogConfirmFieldProps }
