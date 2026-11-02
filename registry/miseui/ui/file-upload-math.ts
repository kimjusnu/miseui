type RejectionReason = "type" | "size" | "count"

interface FileRejection {
  file: File
  reason: RejectionReason
  message: string
}

interface FileLimits {
  /** The same syntax as the input's accept attribute: ".pdf,image/*". */
  accept?: string
  /** Bytes. */
  maxSize?: number
  /** Total, counting what is already in the list. */
  maxFiles?: number
  /** How many are already in the list. */
  existing?: number
}

interface FileMessages {
  type: (file: File, accept: string) => string
  size: (file: File, maxSize: number) => string
  count: (file: File, maxFiles: number) => string
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB"] as const
const KILO = 1024

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B"
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(KILO)), BYTE_UNITS.length - 1)
  const value = bytes / KILO ** unit
  return `${value >= 10 ? Math.round(value) : Number(value.toFixed(1))} ${BYTE_UNITS[unit]}`
}

/**
 * Picking through the dialog filters by accept, but dropping does not, so drops have to be checked by hand.
 * Some systems report an empty type, so an extension rule is the only one that can match those.
 */
function matchesAccept(file: File, accept?: string) {
  if (!accept) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return accept.split(",").some((rule) => {
    const clean = rule.trim().toLowerCase()
    if (!clean) return false
    if (clean.startsWith(".")) return name.endsWith(clean)
    if (clean.endsWith("/*")) return type.startsWith(clean.slice(0, -1))
    return type === clean
  })
}

const DEFAULT_MESSAGES: FileMessages = {
  type: (file) => `${file.name} is not an accepted file type.`,
  size: (file, maxSize) => `${file.name} is larger than ${formatBytes(maxSize)}.`,
  count: (_file, maxFiles) => (maxFiles === 1 ? "Only one file can be added." : `Only ${maxFiles} files can be added.`),
}

function reasonFor(file: File, limits: FileLimits, acceptedSoFar: number): RejectionReason | null {
  if (!matchesAccept(file, limits.accept)) return "type"
  if (limits.maxSize !== undefined && file.size > limits.maxSize) return "size"
  if (limits.maxFiles !== undefined && (limits.existing ?? 0) + acceptedSoFar >= limits.maxFiles) return "count"
  return null
}

function messageFor(reason: RejectionReason, file: File, limits: FileLimits, messages: FileMessages) {
  if (reason === "type") return messages.type(file, limits.accept ?? "")
  if (reason === "size") return messages.size(file, limits.maxSize ?? 0)
  return messages.count(file, limits.maxFiles ?? 0)
}

function validateFiles(files: readonly File[], limits: FileLimits, messages: FileMessages = DEFAULT_MESSAGES) {
  return files.reduce<{ accepted: readonly File[]; rejected: readonly FileRejection[] }>(
    (result, file) => {
      const reason = reasonFor(file, limits, result.accepted.length)
      if (!reason) return { ...result, accepted: [...result.accepted, file] }
      const rejection = { file, reason, message: messageFor(reason, file, limits, messages) }
      return { ...result, rejected: [...result.rejected, rejection] }
    },
    { accepted: [], rejected: [] },
  )
}

/** Several files over the count limit all say the same sentence; once is enough. */
function uniqueMessages(rejected: readonly FileRejection[]) {
  return [...new Set(rejected.map((rejection) => rejection.message))]
}

export {
  DEFAULT_MESSAGES,
  formatBytes,
  matchesAccept,
  uniqueMessages,
  validateFiles,
  type FileLimits,
  type FileMessages,
  type FileRejection,
  type RejectionReason,
}
