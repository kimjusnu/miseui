import { useEffect, useState } from "react"
import { ToolCallCard, type ToolCallStatus } from "@/registry/miseui/ui/tool-call-card"

const RUNNING_MS = 2200
const SETTLED_MS = 3200
const SEARCH_INPUT = { query: "react 19 release notes", limit: 3 }
const SEARCH_OUTPUT = {
  results: [
    { title: "React v19 – React", url: "https://react.dev/blog/2024/12/05/react-19" },
    { title: "React 19 Upgrade Guide", url: "https://react.dev/blog/2024/04/25/react-19-upgrade-guide" },
  ],
}

export function Demo() {
  const [status, setStatus] = useState<ToolCallStatus>("running")

  useEffect(() => {
    const id = window.setTimeout(
      () => setStatus((current) => (current === "running" ? "success" : "running")),
      status === "running" ? RUNNING_MS : SETTLED_MS,
    )
    return () => window.clearTimeout(id)
  }, [status])

  const settled = status !== "running"

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ToolCallCard
        name="search_web"
        status={status}
        input={SEARCH_INPUT}
        output={settled ? SEARCH_OUTPUT : undefined}
        durationMs={settled ? 1240 : undefined}
      />
      <ToolCallCard
        name="read_file"
        status="success"
        durationMs={340}
        input={{ path: "README.md" }}
        output="# Mise UI"
        defaultOpen
      />
      <ToolCallCard
        name="run_tests"
        status="error"
        durationMs={12400}
        output="FAIL registry/miseui/ui/button.test.tsx\n2 failed, 14 passed"
      />
    </div>
  )
}
