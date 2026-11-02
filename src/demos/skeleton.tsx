import { Skeleton } from "@/registry/miseui/ui/skeleton"

export function Demo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  )
}
