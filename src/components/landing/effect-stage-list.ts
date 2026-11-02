import type { ComponentType } from "react"
import {
  BadgeStage,
  ButtonStage,
  CardStage,
  CheckboxStage,
  InputStage,
  SkeletonStage,
  SwitchStage,
  TabsStage,
  type StageProps,
} from "./effect-stages"

export interface Stage {
  name: string
  /** Effect selected first, when the component's first effect looks the same as its plain form. */
  initial?: string
  Render: ComponentType<StageProps>
  /** The call shown under the stage. */
  code: (effect: string | undefined) => string
}

const effectProp = (effect: string | undefined) => (effect ? ` effect="${effect}"` : "")

export const STAGES: readonly Stage[] = [
  { name: "button", Render: ButtonStage, code: (effect) => `<Button${effectProp(effect)}>Generate</Button>` },
  { name: "card", Render: CardStage, code: (effect) => `<Card${effectProp(effect)}>…</Card>` },
  { name: "badge", Render: BadgeStage, code: (effect) => `<Badge${effectProp(effect)}>New model</Badge>` },
  {
    name: "input",
    Render: InputStage,
    code: (effect) => `<Input${effectProp(effect)}${effect === "ai" ? " pending" : ""} />`,
  },
  { name: "skeleton", initial: "wave", Render: SkeletonStage, code: (effect) => `<Skeleton${effectProp(effect)} />` },
  { name: "tabs", Render: TabsStage, code: (effect) => `<Tabs${effectProp(effect)}>…</Tabs>` },
  { name: "switch", Render: SwitchStage, code: (effect) => `<Switch${effectProp(effect)} />` },
  { name: "checkbox", Render: CheckboxStage, code: (effect) => `<Checkbox${effectProp(effect)} />` },
]
