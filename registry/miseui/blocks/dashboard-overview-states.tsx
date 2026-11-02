import type * as React from "react"
import { cn } from "@/registry/miseui/lib/utils"
import { Skeleton } from "@/registry/miseui/ui/skeleton"
import { PANEL_CLASS } from "./dashboard-overview-parts"

/** Same panels as the loaded screen, so nothing jumps when the numbers land. */
function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading dashboard" className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col gap-4">
        <div className={cn(PANEL_CLASS, "flex flex-col gap-6 p-4 @md:p-6")}>
          <div className="flex flex-col gap-2">
            <Skeleton effect="wave" className="h-4 w-48" />
            <Skeleton effect="wave" className="h-12 w-56 rounded-xl @2xl:h-16 @2xl:w-72" />
            <Skeleton effect="wave" className="h-4 w-56" />
          </div>
          <Skeleton effect="wave" className="h-40 w-full rounded-xl @2xl:h-56" />
        </div>
        <div className={cn(PANEL_CLASS, "grid gap-6 p-4 @md:grid-cols-[3fr_2fr_2fr] @md:p-6")}>
          <Skeleton effect="wave" className="h-16 w-full" />
          <Skeleton effect="wave" className="h-16 w-full" />
          <Skeleton effect="wave" className="h-16 w-full" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className={cn(PANEL_CLASS, "p-4")}>
          <Skeleton effect="wave" className="h-24 w-full" />
        </div>
        <div className={cn(PANEL_CLASS, "p-4")}>
          <Skeleton effect="wave" className="h-48 w-full" />
        </div>
      </div>
    </div>
  )
}

interface DashboardMessageProps {
  title: string
  description: string
  action?: React.ReactNode
  role?: "alert"
}

function DashboardMessage({ title, description, action, role }: DashboardMessageProps) {
  return (
    <div role={role} className={cn(PANEL_CLASS, "flex flex-col items-start gap-3 p-6 py-16 @md:p-12")}>
      <h3 className="text-title text-2xl text-balance">{title}</h3>
      <p className="max-w-md text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}

export { DashboardMessage, DashboardSkeleton }
