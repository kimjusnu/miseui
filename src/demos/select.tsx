import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/registry/miseui/ui/select"

export function Demo() {
  return (
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
  )
}
