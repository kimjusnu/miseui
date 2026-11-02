import type { ReactNode } from "react"
import { Avatar } from "@/registry/miseui/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger, type HoverCardContentProps } from "@/registry/miseui/ui/hover-card"

const LINK_CLASS =
  "rounded-sm font-medium underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"

function Design({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </div>
  )
}

function Preview({ trigger, ...content }: HoverCardContentProps & { trigger: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger href="#preview" className={LINK_CLASS} onClick={(event) => event.preventDefault()}>
        {trigger}
      </HoverCardTrigger>
      <HoverCardContent {...content} />
    </HoverCard>
  )
}

/** A small drawing of the linked page, so the demo needs no remote image. */
function PageThumbnail() {
  return (
    <div className="grid size-full content-center gap-2 p-6">
      <div className="h-2 w-1/2 rounded-full bg-foreground/30" />
      <div className="h-2 w-5/6 rounded-full bg-foreground/10" />
      <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
    </div>
  )
}

const PROFILE = {
  variant: "profile",
  name: "Priya Raman",
  handle: "@priya",
  avatar: <Avatar name="Priya Raman" />,
  bio: "Staff designer in Lisbon. Looks after the billing and onboarding flows.",
  facts: [
    { label: "Reviews", value: "312" },
    { label: "Teams", value: "4" },
  ],
} as const

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Design label="plain">
        Requests over the <Preview trigger="soft limit">Past 600 a minute, new requests wait in a queue for up to ten seconds.</Preview> are queued.
      </Design>
      <Design label="profile">
        Reviewed by <Preview trigger="Priya Raman" {...PROFILE} /> this morning.
      </Design>
      <Design label="link-preview">
        Read the{" "}
        <Preview
          trigger="migration guide"
          variant="link-preview"
          title="Moving from v1 to v2 of the API"
          description="What changed, what stays the same and how to run both during the switch."
          domain="docs.northwind.dev"
          media={<PageThumbnail />}
        />{" "}
        before upgrading.
      </Design>
      <Design label="stat">
        The API handled{" "}
        <Preview
          trigger="4.1M requests"
          variant="stat"
          label="Requests, last 7 days"
          value="4,120,381"
          change="Up 12% on the week before"
          trend={[52, 58, 55, 63, 60, 71, 78]}
        />{" "}
        this week.
      </Design>
      <Design label="materialize effect">
        Assigned to <Preview trigger="Priya Raman" effect="materialize" {...PROFILE} /> until Friday.
      </Design>
    </div>
  )
}
