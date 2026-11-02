import { Button } from "@/registry/miseui/ui/button"
import { Spinner, type SpinnerVariant } from "@/registry/miseui/ui/spinner"

const VARIANTS: readonly SpinnerVariant[] = ["ring", "dots", "bars", "orbit"]

export function Demo() {
  return (
    <div className="grid gap-8">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {VARIANTS.map((variant) => (
          <div key={variant} className="grid min-w-0 justify-items-start gap-4">
            <p className="text-xs text-muted-foreground">{variant}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Spinner variant={variant} size="sm" />
              <Spinner variant={variant} size="md" />
              <Spinner variant={variant} size="lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-8 sm:grid-cols-2">
        <div className="grid min-w-0 justify-items-start gap-2">
          <p className="text-xs text-muted-foreground">inside a button</p>
          <Button disabled>
            <Spinner size="sm" label="Saving changes" className="text-current" />
            Saving
          </Button>
        </div>
        <div className="grid min-w-0 justify-items-start gap-2">
          <p className="text-xs text-muted-foreground">with a visible label</p>
          <Spinner variant="orbit" label="Loading invoices" showLabel />
        </div>
      </div>
    </div>
  )
}
