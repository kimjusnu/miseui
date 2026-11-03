import type * as React from "react"
import { useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { CodeBlock } from "@/registry/miseui/ui/code-block"

const RETRY_TS = `// Retries with a growing wait, then gives up.
export async function withRetry<T>(run: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run()
    } catch (error) {
      if (attempt === attempts) throw error
      await sleep(attempt * 250)
    }
  }
  throw new Error("Unreachable")
}`

const CONFIG_JSON = `{
  "name": "invoice-service",
  "port": 8080,
  "retries": 3,
  "tls": true,
  "proxy": null
}`

const INSTALL_BASH = `# Add the component, then start the app
pnpm dlx shadcn@latest add "$REGISTRY/code-block.json"
PORT=3000 pnpm dev --open`

const DIFF = `@@ -12,5 +12,5 @@ export function total(items: Item[]) {
 const subtotal = items.reduce(sum, 0)
-const tax = subtotal * 0.1
+const tax = Math.round(subtotal * TAX_RATE)
 return subtotal + tax
 }`

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function Reveal() {
  const [run, setRun] = useState(0)
  return (
    <Cell label="line-reveal effect">
      <CodeBlock key={run} variant="window" title="install.sh" code={INSTALL_BASH} language="bash" effect="line-reveal" />
      <div>
        <Button variant="outline" size="sm" onClick={() => setRun((current) => current + 1)}>
          <RotateCcw />
          Replay
        </Button>
      </div>
    </Cell>
  )
}

export function Demo() {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
      <Cell label="plain, numbers and marked lines">
        <CodeBlock code={RETRY_TS} language="ts" lineNumbers highlightLines={[7, 8]} label="Retry helper" />
      </Cell>
      <Cell label="window">
        <CodeBlock variant="window" title="config.json" code={CONFIG_JSON} language="json" lineNumbers />
      </Cell>
      <Cell label="tabs">
        <CodeBlock
          variant="tabs"
          files={[
            { name: "retry.ts", code: RETRY_TS, language: "ts" },
            { name: "config.json", code: CONFIG_JSON, language: "json" },
            { name: "install.sh", code: INSTALL_BASH, language: "bash" },
          ]}
        />
      </Cell>
      <Cell label="diff">
        <CodeBlock variant="diff" code={DIFF} language="ts" lineNumbers label="Change to the tax line" />
      </Cell>
      <Reveal />
    </div>
  )
}
