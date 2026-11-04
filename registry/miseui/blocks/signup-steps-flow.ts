import { useEffect, useRef, useState } from "react"

interface SignupCreditedStep {
  id: string
  /** Short name under the progress bar. */
  label: string
  /** Already counted as done when the flow opens. Use it only for something the person has really done, such as starting. */
  credited: true
}

interface SignupQuestionStep {
  id: string
  label: string
  credited?: false
  /** The one question on this screen. */
  question: string
  /** A second sentence in the same heading, in the muted tone: why it is being asked. */
  aside?: string
  fieldLabel: string
  hint?: string
  type?: "text" | "email" | "password" | "url" | "tel"
  autoComplete?: string
  placeholder?: string
  /** Return a message to hold the person here. By default the field only has to be filled in. */
  validate?: (value: string) => string | undefined
  /** A box that must be ticked to move on. It always starts unticked. */
  consent?: string
}

type SignupStep = SignupCreditedStep | SignupQuestionStep
type SignupValues = Readonly<Record<string, string>>

const REQUIRED_MESSAGE = "Fill this in to continue."
const CONSENT_MESSAGE = "Tick the box to continue."
const COMPLETE_FAILED = "Something went wrong. Try again."

function checkStep(step: SignupQuestionStep, value: string, consented: boolean) {
  const problem = step.validate ? step.validate(value) : value.trim() ? undefined : REQUIRED_MESSAGE
  return problem ?? (step.consent && !consented ? CONSENT_MESSAGE : undefined)
}

function isQuestion(step: SignupStep): step is SignupQuestionStep {
  return !step.credited
}

/** The last step's request: its loading state, the failure if any, and the switch to the final screen. */
function useCompletion(onComplete: ((values: SignupValues) => void | Promise<void>) | undefined, setError: (message: string) => void) {
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)

  const finish = async (values: SignupValues) => {
    setPending(true)
    try {
      await onComplete?.(values)
      setDone(true)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : COMPLETE_FAILED)
    } finally {
      setPending(false)
    }
  }

  return { pending, done, finish }
}

function useSignupFlow(steps: readonly SignupStep[], onComplete?: (values: SignupValues) => void | Promise<void>) {
  const questions = steps.filter(isQuestion)
  const [{ index, direction }, setPosition] = useState<{ index: number; direction: 1 | -1 }>({ index: 0, direction: 1 })
  const [values, setValues] = useState<SignupValues>({})
  const [consents, setConsents] = useState<Readonly<Record<string, boolean>>>({})
  const [error, setError] = useState<string>()
  const { pending, done, finish } = useCompletion(onComplete, setError)
  const step = questions[index]

  const next = () => {
    if (pending) return
    const problem = checkStep(step, values[step.id] ?? "", consents[step.id] ?? false)
    setError(problem)
    if (problem) return
    if (index === questions.length - 1) return void finish(values)
    setPosition({ index: index + 1, direction: 1 })
  }

  const back = () => {
    setError(undefined)
    setPosition({ index: index - 1, direction: -1 })
  }

  /** Back to an answered question, for a rail of steps. A later one would skip the work in between, so it is ignored. */
  const goTo = (target: number) => {
    if (pending || target >= index) return
    setError(undefined)
    setPosition({ index: Math.max(0, target), direction: -1 })
  }

  const change = (value: string) => {
    setError(undefined)
    setValues((current) => ({ ...current, [step.id]: value }))
  }

  const toggleConsent = (checked: boolean) => {
    setError(undefined)
    setConsents((current) => ({ ...current, [step.id]: checked }))
  }

  return { questions, step, index, direction, values, consents, error, pending, done, next, back, goTo, change, toggleConsent }
}

type SignupFlow = ReturnType<typeof useSignupFlow>

/** Moves focus on a step change only. On first paint it would scroll a page that has the block further down. */
function useFocusOnChange<T extends HTMLElement>(key: unknown) {
  const ref = useRef<T>(null)
  // The last key, not the first: going back to the first question has to move focus too, because its Back button is gone.
  const lastKey = useRef(key)
  useEffect(() => {
    if (key === lastKey.current) return
    lastKey.current = key
    ref.current?.focus()
  }, [key])
  return ref
}

export {
  useFocusOnChange,
  useSignupFlow,
  type SignupCreditedStep,
  type SignupFlow,
  type SignupQuestionStep,
  type SignupStep,
  type SignupValues,
}
