type PasswordScore = 0 | 1 | 2 | 3 | 4
type PasswordCheckId = "length" | "case" | "number" | "symbol"

interface PasswordCheck {
  id: PasswordCheckId
  met: boolean
}

const DEFAULT_MIN_LENGTH = 12
/** A short password cannot score above fair however varied it looks: length is what slows an attacker most. */
const SHORT_PASSWORD_CAP: PasswordScore = 2
const WEAK_BELOW_BITS = 30
const FAIR_BELOW_BITS = 50
const GOOD_BELOW_BITS = 72
const LOWER_POOL = 26
const UPPER_POOL = 26
const DIGIT_POOL = 10
const SYMBOL_POOL = 33
/** Hangul, Cyrillic and the rest: a rough figure, but they do widen the search. */
const OTHER_POOL = 100

/** Counts the characters that add information. The rest of a repeat (aaaa) or a run (abcd, 4321) gives an attacker nothing to guess. */
function effectiveLength(password: string) {
  const codes = [...password].map((character) => character.codePointAt(0) ?? 0)
  return codes.reduce((count, code, index) => {
    if (index === 0) return 1
    const step = code - codes[index - 1]
    const previousStep = index > 1 ? codes[index - 1] - codes[index - 2] : null
    const repeats = step === 0
    const continuesRun = Math.abs(step) === 1 && step === previousStep
    return repeats || continuesRun ? count : count + 1
  }, 0)
}

function characterPool(password: string) {
  const pools = [
    [/[a-z]/, LOWER_POOL],
    [/[A-Z]/, UPPER_POOL],
    [/[0-9]/, DIGIT_POOL],
    [/[\x20-\x2f\x3a-\x40\x5b-\x60\x7b-\x7e]/, SYMBOL_POOL],
    [/[^\x20-\x7e]/, OTHER_POOL],
  ] as const
  return pools.reduce((total, [pattern, size]) => (pattern.test(password) ? total + size : total), 0)
}

function estimateBits(password: string) {
  if (!password) return 0
  return effectiveLength(password) * Math.log2(characterPool(password))
}

/** A rough estimate with no dictionary, so a long common phrase scores higher than it should. It guides; the server decides. */
function scorePassword(password: string, minLength = DEFAULT_MIN_LENGTH): PasswordScore {
  if (!password) return 0
  const bits = estimateBits(password)
  const score: PasswordScore = bits < WEAK_BELOW_BITS ? 1 : bits < FAIR_BELOW_BITS ? 2 : bits < GOOD_BELOW_BITS ? 3 : 4
  if ([...password].length >= minLength) return score
  return Math.min(score, SHORT_PASSWORD_CAP) as PasswordScore
}

function passwordChecks(password: string, minLength = DEFAULT_MIN_LENGTH): readonly PasswordCheck[] {
  return [
    { id: "length", met: [...password].length >= minLength },
    { id: "case", met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: "number", met: /[0-9]/.test(password) },
    { id: "symbol", met: /[^a-zA-Z0-9]/.test(password) },
  ]
}

export {
  DEFAULT_MIN_LENGTH,
  effectiveLength,
  estimateBits,
  passwordChecks,
  scorePassword,
  type PasswordCheck,
  type PasswordCheckId,
  type PasswordScore,
}
