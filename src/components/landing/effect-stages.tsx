import { Badge, type BadgeEffect } from "@/registry/miseui/ui/badge"
import { Button, type ButtonEffect } from "@/registry/miseui/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, type CardEffect } from "@/registry/miseui/ui/card"
import { Checkbox, type CheckboxEffect } from "@/registry/miseui/ui/checkbox"
import { Input, type InputEffect } from "@/registry/miseui/ui/input"
import { Skeleton, type SkeletonEffect } from "@/registry/miseui/ui/skeleton"
import { Switch, type SwitchEffect } from "@/registry/miseui/ui/switch"
import { Tabs, TabsList, TabsTrigger, type TabsEffect } from "@/registry/miseui/ui/tabs"
import { useCycle } from "./use-cycle"

const COUNT_MS = 1400
const COUNT_LENGTH = 40
const COUNT_START = 7
const CHECK_PHASES = 2
const CHECK_MS = 1600

/** Each stage renders one component at presentation size. `effect` is undefined for the plain one. */
export interface StageProps {
  effect: string | undefined
}

export function ButtonStage({ effect }: StageProps) {
  return (
    <Button size="lg" variant={effect === "liquid" ? "default" : "mise"} effect={effect as ButtonEffect | undefined}>
      {effect === "shimmer" ? "Generating…" : "Generate"}
    </Button>
  )
}

export function CardStage({ effect }: StageProps) {
  return (
    <Card effect={effect as CardEffect | undefined} className="w-full max-w-xs bg-card">
      <CardHeader>
        <CardTitle>Quarterly summary</CardTitle>
        <CardDescription>Churn fell to 3.1%, and three accounts are worth a call.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">Move your pointer over this card.</CardContent>
    </Card>
  )
}

export function BadgeStage({ effect }: StageProps) {
  const tick = useCycle(COUNT_LENGTH, COUNT_MS)
  return (
    <div className="scale-150">
      <Badge effect={effect as BadgeEffect | undefined} variant={effect === "count" ? "mise" : "outline"}>
        {effect === "count" ? COUNT_START + tick : "New model"}
      </Badge>
    </div>
  )
}

export function InputStage({ effect }: StageProps) {
  return (
    <Input
      effect={effect as InputEffect | undefined}
      pending={effect === "ai"}
      placeholder={effect === "ai" ? "Drafting a project title" : "Click here to focus"}
      aria-label="Example field"
      className="w-full max-w-xs"
    />
  )
}

export function SkeletonStage({ effect }: StageProps) {
  return (
    <Skeleton effect={effect as SkeletonEffect | undefined} lines={3} className="h-24 w-full max-w-xs rounded-2xl" />
  )
}

export function TabsStage({ effect }: StageProps) {
  return (
    <Tabs effect={effect as TabsEffect | undefined} defaultValue="day">
      <TabsList>
        <TabsTrigger value="day">Day</TabsTrigger>
        <TabsTrigger value="week">Week</TabsTrigger>
        <TabsTrigger value="month">Month</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export function SwitchStage({ effect }: StageProps) {
  return (
    <div className="scale-[1.6]">
      <Switch effect={effect as SwitchEffect | undefined} defaultChecked aria-label="Example switch" />
    </div>
  )
}

/** Ticks itself, because an unticked box shows nothing of the stroke it is here to show. */
export function CheckboxStage({ effect }: StageProps) {
  const phase = useCycle(CHECK_PHASES, CHECK_MS)
  return (
    <div className="scale-[1.6]">
      <Checkbox effect={effect as CheckboxEffect | undefined} checked={phase === 0} aria-label="Example checkbox" />
    </div>
  )
}
