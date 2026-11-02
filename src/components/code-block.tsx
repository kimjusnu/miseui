import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { cn } from "@/registry/miseui/lib/utils"

const COPIED_RESET_MS = 1600

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
}

export function CodeBlock({ code, language = "tsx", className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), COPIED_RESET_MS)
    return () => window.clearTimeout(id)
  }, [copied])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cn("group relative rounded-lg border bg-card", className)}>
      <pre
        data-language={language}
        className={cn(
          "px-4 py-3 pr-12 font-mono text-[13px] leading-relaxed text-foreground",
          "overflow-x-auto [scrollbar-width:none]",
          language === "bash" && "whitespace-pre",
        )}
      >
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-2 right-2 size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  )
}
