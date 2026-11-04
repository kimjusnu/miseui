import { useEffect, useState } from "react"

const WRONG_CODE = "That code did not work. Check it, or send a new one."
const RESEND_FAILED = "Could not send a new code. Check your connection and try again."
const TICK_MS = 1000

/** Reads the clock rather than counting ticks, because a background tab throttles timers and a count would run slow. */
function useCountdown(seconds: number) {
  const [round, setRound] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(seconds)
  useEffect(() => {
    if (seconds <= 0) return
    const end = Date.now() + seconds * 1000
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setSecondsLeft(left)
      if (left === 0) window.clearInterval(id)
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [round, seconds])
  const restart = () => {
    setSecondsLeft(seconds)
    setRound((current) => current + 1)
  }
  return { secondsLeft, restart }
}

/** The wait before another code may go out, and the sending itself. */
function useResend(onResend: () => void | Promise<void>, seconds: number, onSent: () => void) {
  const { secondsLeft, restart } = useCountdown(seconds)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [resendError, setResendError] = useState<string>()

  const resend = async () => {
    if (secondsLeft > 0 || sending) return
    setSending(true)
    setSent(false)
    setResendError(undefined)
    try {
      await onResend()
      setSent(true)
      restart()
      onSent()
    } catch (problem) {
      setResendError(problem instanceof Error ? problem.message : RESEND_FAILED)
    } finally {
      setSending(false)
    }
  }

  return { secondsLeft, sending, sent, resendError, resend, clearSent: () => setSent(false) }
}

interface VerificationOptions {
  length: number
  onVerify: (code: string) => void | Promise<void>
  onResend: () => void | Promise<void>
  resendAfterSeconds: number
  error?: string
}

function useVerification({ length, onVerify, onResend, resendAfterSeconds, error: outerError }: VerificationOptions) {
  const [code, setCode] = useState("")
  const [checking, setChecking] = useState(false)
  const [verified, setVerified] = useState(false)
  const [localError, setLocalError] = useState<string>()
  const clearCode = () => {
    setCode("")
    setLocalError(undefined)
  }
  const { clearSent, ...resend } = useResend(onResend, resendAfterSeconds, clearCode)

  const verify = async (value: string) => {
    if (checking || verified) return
    if (value.length < length) return setLocalError(`Enter all ${length} digits.`)
    setChecking(true)
    setLocalError(undefined)
    clearSent()
    try {
      await onVerify(value)
      setVerified(true)
    } catch (problem) {
      // Cleared, so the next digit starts a new try instead of landing after the wrong one.
      setCode("")
      setLocalError(problem instanceof Error ? problem.message : WRONG_CODE)
    } finally {
      setChecking(false)
    }
  }

  const change = (value: string) => {
    setCode(value)
    setLocalError(undefined)
  }

  return { code, checking, verified, error: localError ?? outerError, change, verify, ...resend }
}

type Verification = ReturnType<typeof useVerification>

export { useCountdown, useVerification, WRONG_CODE, type Verification }
