import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "before-after",
  title: "Before After",
  category: "display",
  description: "Two versions of one thing in the same frame, compared with a divider you drag or a lens that follows the pointer.",
  why: {
    principle: "Change blindness",
    explanation:
      "People are poor at spotting differences between two pictures placed side by side, because the eye has to jump and remember. Laying them in one frame and moving a line across makes the difference happen in place, and the reader does the comparing themselves, which is more convincing than being told.",
    avoid:
      "Do not use it for two things that do not line up, such as different crops or layouts, where the divider only shows a mess. On a phone the frame takes over the drag, so keep it small enough to scroll past.",
  },
  designs: [
    {
      name: "split",
      principle: "Mapping",
      use: "The default for photos and redesigns: most differences read best across the width, and the page still scrolls under a finger.",
    },
    {
      name: "curtain",
      principle: "Mapping",
      use: "For tall subjects or anything layered top to bottom, such as a full page or a map with and without its data.",
    },
    {
      name: "lens",
      principle: "Focus and context",
      use: "When the change is in the fine detail, such as sharpening or a retouch: the window follows the pointer with the old version all around it.",
    },
  ],
  effects: [
    {
      name: "sweep",
      principle: "Signifiers",
      use: "When the frame could pass for a plain image: the divider moves once when it comes into view, shows it can be moved, and returns without reporting a change.",
    },
  ],
  usage: `import { BeforeAfter } from "@/components/ui/before-after"

<BeforeAfter
  before={<img src="/old.jpg" alt="The old checkout" className="size-full object-cover" />}
  after={<img src="/new.jpg" alt="The new checkout" className="size-full object-cover" />}
  beforeLabel="2024"
  afterLabel="2026"
  effect="sweep"
/>`,
  exports: ["BeforeAfter"],
}
