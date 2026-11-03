import { useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogConfirmField,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  type AlertDialogEffect,
  type AlertDialogVariant,
} from "@/registry/miseui/ui/alert-dialog"

interface Copy {
  variant: AlertDialogVariant
  effect?: AlertDialogEffect
  label: string
  trigger: string
  title: string
  description: string
  cancel: string
  action: string
  result: string
}

const CASES: readonly Copy[] = [
  {
    variant: "plain",
    label: "plain",
    trigger: "Sign out everywhere",
    title: "Sign out on every device?",
    description: "You will stay signed in here. Your other devices will ask for the password again.",
    cancel: "Stay signed in",
    action: "Sign out",
    result: "Signed out on 3 devices",
  },
  {
    variant: "destructive",
    label: "destructive",
    trigger: "Delete project",
    title: "Delete this project?",
    description: "Its 214 files and all review comments go with it. This cannot be undone.",
    cancel: "Keep project",
    action: "Delete project",
    result: "Project deleted",
  },
  {
    variant: "typed",
    label: "typed",
    trigger: "Delete workspace",
    title: "Delete the workspace?",
    description: "Everyone loses access at once, and billing stops at the end of the month.",
    cancel: "Keep workspace",
    action: "Delete workspace",
    result: "Workspace deleted",
  },
  {
    variant: "compact",
    label: "compact",
    trigger: "Discard draft",
    title: "Discard this draft?",
    description: "It has not been saved.",
    cancel: "Keep",
    action: "Discard",
    result: "Draft discarded",
  },
  {
    variant: "destructive",
    effect: "materialize",
    label: "materialize effect",
    trigger: "Remove member",
    title: "Remove Mina from the team?",
    description: "She loses access to all projects right away. You can invite her back later.",
    cancel: "Keep member",
    action: "Remove",
    result: "Mina removed",
  },
]

function Example({ copy }: { copy: Copy }) {
  const [outcome, setOutcome] = useState("Nothing changed yet")
  const compactDiscard = copy.variant === "compact" ? "destructive" : undefined
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{copy.label}</p>
      <AlertDialog variant={copy.variant} effect={copy.effect} tone={compactDiscard} confirmWord={copy.variant === "typed" ? "north-star" : undefined}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">{copy.trigger}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {copy.variant === "typed" ? <AlertDialogConfirmField /> : null}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOutcome("Nothing changed")}>{copy.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setOutcome(copy.result)}>{copy.action}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <p role="status" className="text-[13px] text-muted-foreground">
        {outcome}
      </p>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {CASES.map((copy) => (
        <Example key={copy.label} copy={copy} />
      ))}
    </div>
  )
}
