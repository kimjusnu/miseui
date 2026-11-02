import { Skeleton } from "@/registry/miseui/ui/skeleton"

const EFFECT_LABEL_CLASS = "font-mono text-xs text-muted-foreground"

export function Demo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className={EFFECT_LABEL_CLASS}>pulse</span>
          <Skeleton effect="pulse" className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <span className={EFFECT_LABEL_CLASS}>wave</span>
          <Skeleton effect="wave" className="h-10 w-full" />
        </div>
        <div className="flex flex-col gap-2">
          <span className={EFFECT_LABEL_CLASS}>gooey</span>
          <Skeleton effect="gooey" lines={3} className="w-full" />
        </div>
      </div>
    </div>
  )
}
