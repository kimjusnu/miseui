import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type SelectEffect,
} from "@/registry/miseui/ui/select"

const EFFECTS: readonly SelectEffect[] = ["materialize", "spring"]

export function Demo() {
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Select defaultValue="weekly">
          <SelectTrigger className="w-44" aria-label="Digest frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Digest</SelectLabel>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectItem value="never">Never</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger size="sm" className="w-40" aria-label="Time zone">
            <SelectValue placeholder="Time zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seoul">Seoul</SelectItem>
            <SelectItem value="london">London</SelectItem>
            <SelectItem value="new-york">New York</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-4">
        {EFFECTS.map((effect) => (
          <div key={effect} className="grid gap-1.5">
            <p className="text-xs text-muted-foreground">{effect}</p>
            <Select defaultValue="weekly">
              <SelectTrigger size="sm" className="w-32" aria-label={`Digest frequency, ${effect} effect`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent effect={effect}>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
