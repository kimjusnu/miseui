import { cn } from "@/registry/miseui/lib/utils"

type InputGroupVariant = "attached" | "inset" | "stacked" | "inline"

/** Focus and error live on the root, so input, addons and buttons read as one field with one ring. */
const FIELD_STATE_CLASS = cn(
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-(--ease-mise) cursor-text",
  "has-[input:focus-visible,select:focus-visible]:border-ring has-[input:focus-visible,select:focus-visible]:ring-[3px] has-[input:focus-visible,select:focus-visible]:ring-ring/50",
  "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/20 dark:has-[[aria-invalid=true]]:ring-destructive/40",
  "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
)

const ROOT_CLASS: Record<InputGroupVariant, string> = {
  attached: "flex h-9 items-stretch divide-x divide-input rounded-md border border-input shadow-xs pointer-coarse:h-10",
  inset: "flex h-9 items-center gap-2 rounded-md border border-input px-3 shadow-xs pointer-coarse:h-10",
  stacked: "grid gap-1 rounded-md border border-input px-3 py-2 shadow-xs",
  inline: "flex min-h-10 items-center gap-3 rounded-md border border-transparent bg-foreground/[0.05] px-3",
}

const ADDON_CLASS: Record<InputGroupVariant, string> = {
  attached: "flex shrink-0 items-center gap-2 bg-foreground/[0.04] px-3 first:rounded-l-[inherit] last:rounded-r-[inherit]",
  inset: "flex shrink-0 items-center gap-2",
  stacked: "flex shrink-0 items-center gap-2",
  inline: "flex shrink-0 items-center gap-2",
}

/** min-w-24: below that the placeholder is cut instead of moving, and a typed value has no room to be read. */
const INPUT_BASE_CLASS = cn(
  "w-0 min-w-24 flex-1 bg-transparent text-base text-foreground outline-none md:text-sm",
  "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground disabled:cursor-not-allowed",
)

const INPUT_CLASS: Record<InputGroupVariant, string> = {
  attached: "px-3 first:rounded-l-[inherit] last:rounded-r-[inherit]",
  inset: "h-full",
  stacked: "h-6",
  inline: "text-right",
}

const BUTTON_BASE_CLASS = cn(
  "relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap outline-none select-none",
  "transition-[color,background-color] duration-(--duration-fast) ease-(--ease-mise) active:duration-0",
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset",
  "disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
)

const HIT_AREA_CLASS =
  "pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-10 pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2"

const BUTTON_SHAPE_CLASS: Record<InputGroupVariant, string> = {
  attached: "h-full px-3 text-sm first:rounded-l-[inherit] last:rounded-r-[inherit]",
  inset: cn("-mr-2 h-7 rounded-sm px-2 text-[13px]", HIT_AREA_CLASS),
  stacked: cn("h-6 rounded-sm px-2 text-[13px]", HIT_AREA_CLASS),
  inline: cn("h-7 rounded-sm px-2 text-[13px]", HIT_AREA_CLASS),
}

const BUTTON_TONE_CLASS = {
  quiet: "text-foreground hover:bg-foreground/[0.07] active:bg-foreground/10",
  primary: "bg-mise text-mise-foreground hover:bg-mise/90 active:bg-mise/80",
}

const SELECT_WRAP_CLASS: Record<InputGroupVariant, string> = {
  attached: "bg-foreground/[0.04] first:rounded-l-[inherit] last:rounded-r-[inherit]",
  inset: "",
  stacked: "",
  inline: "",
}

/** On touch `stacked` grows to 40 px and takes the extra back with a negative margin, so the box keeps its height. */
const SELECT_CLASS: Record<InputGroupVariant, string> = {
  attached: "pr-8 pl-3",
  inset: "pr-5",
  stacked: "h-6 pr-5 pointer-coarse:-my-2 pointer-coarse:h-10",
  inline: "h-7 pr-5 pointer-coarse:h-10",
}

const CHEVRON_CLASS: Record<InputGroupVariant, string> = {
  attached: "right-2",
  inset: "right-0",
  stacked: "right-0",
  inline: "right-0",
}

/** Text inside the field that does not start a click on a real control sends focus to the input, as a whole field should. */
function shouldFocusField(target: Element) {
  return !target.closest("input,select,button,a,label")
}

export {
  ADDON_CLASS,
  BUTTON_BASE_CLASS,
  BUTTON_SHAPE_CLASS,
  BUTTON_TONE_CLASS,
  CHEVRON_CLASS,
  FIELD_STATE_CLASS,
  INPUT_BASE_CLASS,
  INPUT_CLASS,
  ROOT_CLASS,
  SELECT_CLASS,
  SELECT_WRAP_CLASS,
  shouldFocusField,
  type InputGroupVariant,
}
