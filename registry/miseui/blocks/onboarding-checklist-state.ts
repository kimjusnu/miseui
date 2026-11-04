import type * as React from "react"
import { useState } from "react"

interface OnboardingStep {
  id: string
  title: string
  /** Continues the title, one tone quieter. Say what the step gets them, not how the screen works. */
  description: string
  actionLabel: string
  icon?: React.ComponentType<{ className?: string }>
}

interface OnboardingStepFailure {
  id: string
  message: string
}

const STEP_FAILED = "That step did not finish. Try it again."

/** Ids that no longer match a step are not progress, so the count can never claim more than is really done. */
function doneStepIds(steps: readonly OnboardingStep[], completed: readonly string[]) {
  return steps.filter((step) => completed.includes(step.id)).map((step) => step.id)
}

function firstOpenStep(steps: readonly OnboardingStep[], done: readonly string[]) {
  return steps.find((step) => !done.includes(step.id))
}

interface OnboardingOptions {
  steps: readonly OnboardingStep[]
  completed?: readonly string[]
  defaultCompleted: readonly string[]
  onCompletedChange?: (completed: readonly string[]) => void
  onStep?: (id: string) => void | Promise<void>
}

function useOnboarding({ steps, completed, defaultCompleted, onCompletedChange, onStep }: OnboardingOptions) {
  const [internal, setInternal] = useState(defaultCompleted)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [failure, setFailure] = useState<OnboardingStepFailure | null>(null)
  const current = completed ?? internal
  const done = doneStepIds(steps, current)

  const setDone = (id: string, state: boolean) => {
    const without = current.filter((item) => item !== id)
    const next = state ? [...without, id] : without
    setInternal(next)
    onCompletedChange?.(next)
  }

  /** True once the step's work went through, so a screen can move on. A controlled owner still decides what counts as done. */
  const press = async (id: string) => {
    if (pendingId !== null) return false
    setFailure(null)
    setPendingId(id)
    try {
      await onStep?.(id)
      if (completed === undefined) setDone(id, true)
      return true
    } catch (problem) {
      setFailure({ id, message: problem instanceof Error ? problem.message : STEP_FAILED })
      return false
    } finally {
      setPendingId(null)
    }
  }

  return {
    done,
    doneCount: done.length,
    total: steps.length,
    next: firstOpenStep(steps, done),
    allDone: done.length === steps.length,
    pendingId,
    failure,
    setDone,
    press,
  }
}

type Onboarding = ReturnType<typeof useOnboarding>

export { doneStepIds, firstOpenStep, useOnboarding, type Onboarding, type OnboardingOptions, type OnboardingStep }
