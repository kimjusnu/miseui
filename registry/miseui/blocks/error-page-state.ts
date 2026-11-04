import { useState, useSyncExternalStore } from "react"

const noSubscribe = () => () => undefined

function subscribeToConnection(notify: () => void) {
  window.addEventListener("online", notify)
  window.addEventListener("offline", notify)
  return () => {
    window.removeEventListener("online", notify)
    window.removeEventListener("offline", notify)
  }
}

/** The server cannot know, so it renders what the error itself says: no connection. */
function useOnline() {
  return useSyncExternalStore(subscribeToConnection, () => navigator.onLine, () => false)
}

/** Read from the browser and not faked: the readout shows the address this page is really on. */
function usePathname() {
  return useSyncExternalStore(noSubscribe, () => window.location.pathname, () => "")
}

function reloadPage() {
  window.location.reload()
}

function useRetry(onRetry: () => void | Promise<void>) {
  const [retrying, setRetrying] = useState(false)
  const [failed, setFailed] = useState(false)
  const retry = async () => {
    if (retrying) return
    setRetrying(true)
    setFailed(false)
    try {
      await onRetry()
    } catch {
      setFailed(true)
    } finally {
      setRetrying(false)
    }
  }
  return { retrying, failed, retry }
}

type Retry = ReturnType<typeof useRetry>

export { reloadPage, useOnline, usePathname, useRetry, type Retry }
