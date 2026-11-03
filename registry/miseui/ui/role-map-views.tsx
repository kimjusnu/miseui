import type * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/registry/miseui/lib/utils"

type RoleMapVariant = "panels" | "rows" | "matrix"

interface RoleMember {
  name: string
  /** What they are, such as "Product design". */
  role?: string
  /** The areas they took on. */
  owns: readonly string[]
  /** The person this map is about. Gets the accent. */
  lead?: boolean
}

interface RoleFocus {
  enabled: boolean
  active: string | null
  pinned: string | null
  hover: (name: string | null) => void
  toggle: (name: string) => void
}

interface ViewProps {
  members: readonly RoleMember[]
  focus: RoleFocus
  emptyText: string
}

/** First appearance sets the order, so the table reads in the order the data was written. */
function collectAreas(members: readonly RoleMember[]) {
  return [...new Set(members.flatMap((member) => member.owns))]
}

const DIM = "transition-opacity duration-(--duration-base) ease-(--ease-mise) motion-reduce:transition-none"

function dimmed(focus: RoleFocus, name: string) {
  return focus.active !== null && focus.active !== name
}

function MemberName({ member, focus, className }: { member: RoleMember; focus: RoleFocus; className?: string }) {
  const base = cn("min-w-0 text-start text-sm leading-5 font-medium wrap-break-word", className)
  if (!focus.enabled) return <span className={base}>{member.name}</span>
  return (
    <button
      type="button"
      aria-pressed={focus.pinned === member.name}
      data-slot="role-map-person"
      className={cn(base, "-mx-1 rounded-sm px-1 underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:min-h-10")}
      onClick={() => focus.toggle(member.name)}
    >
      {member.name}
    </button>
  )
}

/** Mouse only: a tap also fires enter and leave, which would fight the pin it is about to set. */
function hoverProps(focus: RoleFocus, name: string): React.HTMLAttributes<HTMLElement> {
  if (!focus.enabled) return {}
  return {
    onPointerEnter: (event: React.PointerEvent) => {
      if (event.pointerType !== "touch") focus.hover(name)
    },
    onPointerLeave: () => focus.hover(null),
  }
}

function RolePanels({ members, focus, emptyText }: ViewProps) {
  return (
    <ul data-slot="role-map-panels" className="grid min-w-0 gap-2 @md:grid-cols-2">
      {members.map((member) => (
        <li
          key={member.name}
          data-slot="role-map-member"
          data-lead={member.lead ? "true" : undefined}
          data-dimmed={dimmed(focus, member.name) ? "true" : undefined}
          className={cn("min-w-0 rounded-lg p-4", DIM, member.lead ? "border border-transparent bg-mise-soft" : "border", dimmed(focus, member.name) && "opacity-40")}
          {...hoverProps(focus, member.name)}
        >
          <MemberName member={member} focus={focus} />
          {member.role ? <p className="text-[13px] leading-5 text-muted-foreground">{member.role}</p> : null}
          {member.owns.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1">
              {member.owns.map((area) => (
                <li key={area} className={cn("rounded-sm px-2 py-1 text-[13px] leading-5", member.lead ? "bg-background/70" : "bg-muted text-muted-foreground")}>
                  {area}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-[13px] leading-5 text-muted-foreground">{emptyText}</p>
          )}
        </li>
      ))}
    </ul>
  )
}

function RoleRows({ members, focus, emptyText }: ViewProps) {
  return (
    <ul data-slot="role-map-rows" className="grid min-w-0 grid-cols-[minmax(0,1fr)]">
      {members.map((member) => (
        <li
          key={member.name}
          data-slot="role-map-member"
          data-lead={member.lead ? "true" : undefined}
          data-dimmed={dimmed(focus, member.name) ? "true" : undefined}
          className={cn("grid min-w-0 gap-x-4 gap-y-1 border-b py-3 last:border-b-0 @md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]", DIM, dimmed(focus, member.name) && "opacity-40")}
          {...hoverProps(focus, member.name)}
        >
          <span className="grid min-w-0 justify-items-start">
            <MemberName member={member} focus={focus} />
            {member.role ? <span className="text-[13px] leading-5 text-muted-foreground">{member.role}</span> : null}
          </span>
          <span className={cn("min-w-0 text-[13px] leading-5 text-pretty", member.lead ? "text-foreground" : "text-muted-foreground")}>
            {member.owns.length > 0 ? member.owns.join(", ") : emptyText}
          </span>
        </li>
      ))}
    </ul>
  )
}

function MatrixCell({ member, area, focus }: { member: RoleMember; area: string; focus: RoleFocus }) {
  const owned = member.owns.includes(area)
  return (
    <td data-slot="role-map-cell" data-dimmed={dimmed(focus, member.name) ? "true" : undefined} className={cn("border-t py-2 text-center", DIM, member.lead && "bg-mise-soft", dimmed(focus, member.name) && "opacity-40")}>
      {owned ? <Check aria-hidden="true" className="mx-auto size-4" /> : null}
      <span className="sr-only">{owned ? `${member.name}: yes` : `${member.name}: no`}</span>
    </td>
  )
}

function RoleMatrix({ members, focus, label }: Omit<ViewProps, "emptyText"> & { label: string }) {
  const areas = collectAreas(members)
  return (
    // Fixed layout makes the columns share the width, so a narrow cell squeezes the names instead of overflowing.
    <table data-slot="role-map-matrix" className="w-full min-w-0 table-fixed border-collapse text-[13px] leading-5">
      <caption className="sr-only">{label}</caption>
      <thead>
        <tr>
          <th scope="col" className="w-[34%] py-2 pe-2 text-start font-normal text-muted-foreground">
            <span className="sr-only">Area</span>
          </th>
          {members.map((member) => (
            <th key={member.name} scope="col" className={cn("px-1 py-2 align-bottom text-center", DIM, member.lead && "rounded-t-sm bg-mise-soft", dimmed(focus, member.name) && "opacity-40")} {...hoverProps(focus, member.name)}>
              <MemberName member={member} focus={focus} className="text-center text-[13px]" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {areas.map((area) => (
          <tr key={area}>
            <th scope="row" className="border-t py-2 pe-2 text-start font-normal wrap-break-word text-muted-foreground">
              {area}
            </th>
            {members.map((member) => (
              <MatrixCell key={member.name} member={member} area={area} focus={focus} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { RoleMatrix, RolePanels, RoleRows, collectAreas, type RoleFocus, type RoleMapVariant, type RoleMember }
