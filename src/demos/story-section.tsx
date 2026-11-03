import { StorySection, type StorySectionProps } from "@/registry/miseui/ui/story-section"

const BODY = "Half of new teams never invited a second person. They signed up, looked around alone and left within the week."

function Example({ label, ...props }: Pick<StorySectionProps, "variant" | "effect"> & { label: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <StorySection as="h3" no={1} title="The problem" {...props}>
        <p>{BODY}</p>
      </StorySection>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Example label="stacked" />
      <Example label="chapter" variant="chapter" />
      <div className="sm:col-span-2">
        <Example label="aside, the heading moves beside the text when the column is wide" variant="aside" />
      </div>
      <Example label="reveal effect" effect="reveal" />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-2">
        <p className="text-xs text-muted-foreground">pending, no text yet</p>
        <StorySection as="h3" no={3} title="The result" pending="What changed after launch? Compare the invite rate before and after." />
      </div>
    </div>
  )
}
