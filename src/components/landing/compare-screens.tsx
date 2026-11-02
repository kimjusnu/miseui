import { ArrowRight } from "lucide-react"
import { Button } from "@/registry/miseui/ui/button"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"

/** Inert on purpose: these sit under a slider that owns every pointer on the frame. */

const PLAIN_FIELD = { width: "100%", border: "1px solid #999", padding: 5, boxSizing: "border-box" } as const

/**
 * What a developer writes without a designer. Deliberately honest rather than ugly: browser-default
 * controls and hard-coded colours, the kind of screen that works and looks unfinished.
 */
export function PlainScreen() {
  return (
    <div
      aria-hidden="true"
      className="grid h-full w-full place-items-center bg-white p-5 text-left sm:p-8"
      style={{ fontFamily: "Arial, Helvetica, sans-serif", color: "#222", fontSize: 14 }}
    >
      <div className="w-full max-w-sm" style={{ border: "1px solid #ccc", padding: 16 }}>
        <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>Create your account</h3>
        <p style={{ margin: "0 0 14px", color: "#555" }}>Please fill in the form below.</p>
        <p style={{ margin: "0 0 4px", fontWeight: 700 }}>Email</p>
        <input tabIndex={-1} readOnly style={PLAIN_FIELD} value="dana@northwind.dev" />
        <p style={{ margin: "12px 0 4px", fontWeight: 700 }}>Password</p>
        <input tabIndex={-1} readOnly type="password" style={PLAIN_FIELD} value="password" />
        <div style={{ marginTop: 14 }}>
          <button tabIndex={-1} type="button" style={{ background: "#2563eb", color: "#fff", border: 0, padding: "7px 14px", marginRight: 6 }}>
            Submit
          </button>
          <button tabIndex={-1} type="button" style={{ background: "#e5e5e5", border: 0, padding: "7px 14px" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/** The same form, same fields, with the decisions made: hierarchy, spacing, one focal action. */
export function MiseScreen() {
  return (
    <div aria-hidden="true" inert className="grid h-full w-full place-items-center bg-muted p-5 sm:p-8">
      <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-[0_16px_40px_-24px_color-mix(in_oklab,var(--foreground)_40%,transparent)]">
        <h3 className="text-title text-xl leading-snug">
          Create your account.
          <span className="text-muted-foreground"> Free for your first project.</span>
        </h3>
        <div className="mt-5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compare-email">Work email</Label>
            <Input id="compare-email" readOnly defaultValue="dana@northwind.dev" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compare-password">Password</Label>
            <Input id="compare-password" readOnly type="password" defaultValue="password" />
          </div>
        </div>
        <Button variant="mise" className="mt-5 w-full">
          Continue <ArrowRight />
        </Button>
        <p className="mt-3 text-center text-[13px] text-muted-foreground">You pick a plan after you have tried it.</p>
      </div>
    </div>
  )
}
