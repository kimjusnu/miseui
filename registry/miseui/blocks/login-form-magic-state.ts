import { useEffect, useState } from "react"
import { validateEmail } from "./login-form-parts"

const SEND_FAILED = "Could not send the link. Check your connection and try again."
const TICK_MS = 1000

function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0)
  const running = secondsLeft > 0
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), TICK_MS)
    return () => window.clearInterval(id)
  }, [running])
  return [secondsLeft, setSecondsLeft] as const
}

/** The request itself and the wait before another may go out. */
function useLinkRequest(onSendLink: (email: string) => void | Promise<void>, resendAfterSeconds: number) {
  const [sendError, setSendError] = useState<string>()
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useCountdown()

  const send = async (address: string) => {
    setSending(true)
    setSendError(undefined)
    try {
      await onSendLink(address)
      setSentTo(address)
      setSecondsLeft(resendAfterSeconds)
      return true
    } catch (failure) {
      setSendError(failure instanceof Error ? failure.message : SEND_FAILED)
      return false
    } finally {
      setSending(false)
    }
  }

  const reset = () => {
    setSentTo(null)
    setSendError(undefined)
    setSecondsLeft(0)
  }

  return { sendError, setSendError, sending, sentTo, secondsLeft, send, reset }
}

/** The screen's state. The address survives going back, so nobody retypes it. */
function useMagicLink(onSendLink: (email: string) => void | Promise<void>, resendAfterSeconds: number) {
  const [email, setEmail] = useState("")
  const [fieldError, setFieldError] = useState<string>()
  const [resent, setResent] = useState(false)
  const [cameBack, setCameBack] = useState(false)
  const { sendError, setSendError, sending, sentTo, secondsLeft, send, reset } = useLinkRequest(onSendLink, resendAfterSeconds)

  /** False when the field holds the person back, so the screen can move focus to it. */
  const submit = async () => {
    const problem = validateEmail(email)
    setFieldError(problem)
    if (problem) return false
    return send(email.trim())
  }

  const resend = async () => {
    if (sentTo === null || secondsLeft > 0 || sending) return
    setResent(await send(sentTo))
  }

  const change = (value: string) => {
    setEmail(value)
    setFieldError(undefined)
    setSendError(undefined)
  }

  const startOver = () => {
    reset()
    setResent(false)
    setCameBack(true)
  }

  return { email, fieldError, sendError, sending, sentTo, resent, cameBack, secondsLeft, change, submit, resend, startOver }
}

type MagicLink = ReturnType<typeof useMagicLink>

export { useMagicLink, type MagicLink }
