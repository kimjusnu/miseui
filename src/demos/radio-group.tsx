import { RadioGroup, RadioGroupItem, type RadioGroupVariant } from "@/registry/miseui/ui/radio-group"

const VARIANTS: readonly RadioGroupVariant[] = ["plain", "card", "segmented", "list"]

function DeliveryOptions({ variant, spring }: { variant: RadioGroupVariant; spring: boolean }) {
  const label = `Delivery speed, ${variant}${spring ? ", spring effect" : ""}`
  return (
    <RadioGroup aria-label={label} variant={variant} effect={spring ? "spring" : undefined} defaultValue="standard">
      <RadioGroupItem value="standard" description="Arrives in 3 to 5 days">
        Standard
      </RadioGroupItem>
      <RadioGroupItem value="express" description="Arrives tomorrow">
        Express
      </RadioGroupItem>
      <RadioGroupItem value="pickup" description="Ready at the counter today">
        Pickup
      </RadioGroupItem>
    </RadioGroup>
  )
}

export function Demo() {
  return (
    <div className="grid w-full max-w-xl min-w-0 gap-6">
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid min-w-0 gap-2">
          <p className="text-xs text-muted-foreground">{variant}</p>
          <DeliveryOptions variant={variant} spring={false} />
        </div>
      ))}
      {VARIANTS.map((variant) => (
        <div key={variant} className="grid min-w-0 gap-2">
          <p className="text-xs text-muted-foreground">{variant} with spring</p>
          <DeliveryOptions variant={variant} spring />
        </div>
      ))}
    </div>
  )
}
