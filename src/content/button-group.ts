import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "button-group",
  title: "Button Group",
  category: "forms",
  description: "Related actions joined under one border, across or down, including a main action with a menu of its alternatives.",
  why: {
    principle: "Law of common region",
    explanation:
      "One shared border says these actions belong to the same object, so the eye reads one control instead of counting several. A split button goes further: the common action stays one click away while its rarer alternatives wait in a menu, without adding more buttons to the page.",
    avoid:
      "These are actions and hold no state. If one option stays chosen, use Toggle Group or Segmented Control. Do not join unrelated actions just to save space, and do not join a destructive action to a safe one where a slip would cost something.",
  },
  designs: [
    {
      name: "plain",
      principle: "Figure and ground",
      use: "On a toolbar or a quiet header, where one soft fill groups the actions without adding a line.",
    },
    {
      name: "outline",
      principle: "Law of connectedness",
      use: "The default: secondary actions on a record or a message, with hairlines that stay out of the content's way.",
    },
    {
      name: "split",
      principle: "Hick's law",
      use: "When one action is what most people want and the others are rarer, such as publish now against schedule.",
    },
    {
      name: "pill",
      principle: "Law of proximity",
      use: "On media or a canvas, where a floating tray holds a few loosely related actions with room between them.",
    },
  ],
  effects: [
    {
      name: "press",
      principle: "Doherty threshold",
      use: "When actions repeat quickly: the label dips on the first frame and the joined border stays still, so the group never looks broken.",
    },
  ],
  usage: `import { ButtonGroup, ButtonGroupItem, ButtonGroupMenu } from "@/components/ui/button-group"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

<ButtonGroup aria-label="Message">
  <ButtonGroupItem>Reply</ButtonGroupItem>
  <ButtonGroupItem>Forward</ButtonGroupItem>
</ButtonGroup>

<ButtonGroup variant="split" aria-label="Publish" effect="press">
  <ButtonGroupItem>Publish</ButtonGroupItem>
  <ButtonGroupMenu label="More publish options">
    <DropdownMenuItem>Schedule for later</DropdownMenuItem>
  </ButtonGroupMenu>
</ButtonGroup>`,
  exports: ["ButtonGroup", "ButtonGroupItem", "ButtonGroupMenu"],
}
