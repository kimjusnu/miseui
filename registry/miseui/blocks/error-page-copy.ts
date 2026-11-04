type ErrorPageCode = "404" | "500" | "offline"

interface ErrorPageLink {
  label: string
  description?: string
  /** Without it the row is only something to read, such as a thing to check. */
  href?: string
}

interface ErrorCopy {
  /** The name of the error, for the small line and the readout. */
  name: string
  title: string
  /** Says what happened and what can be done. Blames nobody, and does not claim a cause nobody knows. */
  detail: string
  /** One plain sentence for the terminal readout. */
  readout: string
  /** Heads the list on `split`. */
  listTitle: string
  list: readonly ErrorPageLink[]
}

const ERROR_COPY: Record<ErrorPageCode, ErrorCopy> = {
  "404": {
    name: "Error 404",
    title: "We could not find this page.",
    detail: "It may have moved, or the link may be out of date.",
    readout: "Nothing is published at this address.",
    listTitle: "These pages are still here.",
    list: [
      { label: "Invoices", description: "Everything you have sent and drafted.", href: "#invoices" },
      { label: "Customers", description: "The people and companies you bill.", href: "#customers" },
      { label: "Help centre", description: "Search the guides.", href: "#help" },
    ],
  },
  "500": {
    name: "Error 500",
    title: "Something went wrong on our side.",
    detail: "The page did not load. Nothing you did caused this, and trying again may work.",
    readout: "The server could not finish this request.",
    listTitle: "If it keeps happening.",
    list: [
      { label: "Status page", description: "See whether we already know.", href: "#status" },
      { label: "Contact support", description: "Include the reference, if there is one.", href: "#support" },
    ],
  },
  offline: {
    name: "No connection",
    title: "This page needs a connection.",
    detail: "It could not reach the network from this device. Check your connection, then try again.",
    readout: "The request did not reach the network.",
    listTitle: "Worth checking.",
    list: [{ label: "Wi-Fi or mobile data is on" }, { label: "Airplane mode is off" }, { label: "A VPN or firewall is not blocking the page" }],
  },
}

const SERVER_ERROR = /^5\d\d$/

/** A plain string lookup would hand back Object.prototype members for a value such as "constructor". */
function resolveErrorCode(code: unknown): ErrorPageCode {
  const text = String(code)
  if (text === "offline" || text === "404" || text === "500") return text
  // Any other 5xx is still our side; anything else keeps the wording that assumes the least.
  return SERVER_ERROR.test(text) ? "500" : "404"
}

export { ERROR_COPY, resolveErrorCode, type ErrorCopy, type ErrorPageCode, type ErrorPageLink }
