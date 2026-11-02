import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "avatar",
  title: "Avatar",
  category: "display",
  description: "A face or initials that identifies a person at a glance, alone or as an overlapping group with a +N.",
  why: {
    principle: "Recognition over recall",
    explanation:
      "People find a colleague by face or colour faster than by reading a name in a list. Initials take a colour computed from the name, so the same person looks the same on every screen, and the group caps its faces with a +N so a large team reads as a count and not as a wall.",
    avoid:
      "Do not make an avatar the only place a name appears; pair it with the name where the person matters. Do not put a presence mark on people whose status you do not actually track.",
  },
  designs: [
    {
      name: "circle",
      principle: "Face perception",
      use: "For people, by default. The round crop centres on the face and reads as a person before anything else.",
    },
    {
      name: "rounded",
      principle: "Similarity",
      use: "For teams, workspaces and products, so a shape difference says this one is not a person.",
    },
    {
      name: "ring",
      principle: "Selective attention",
      use: "For the one person who is speaking or presenting right now, so the eye finds them in a row of faces.",
    },
    {
      name: "status",
      principle: "Visibility of system status",
      use: "In a member list or a chat, when knowing who is available decides whom to ask.",
    },
  ],
  effects: [
    {
      name: "stack",
      principle: "Direct manipulation",
      use: "On AvatarGroup, when people want to see who is in the group: faces part under the pointer on a spring.",
    },
  ],
  usage: `import { Avatar, AvatarGroup } from "@/components/ui/avatar"

<Avatar name="Mina Park" src="/mina.jpg" />
<Avatar name="Mina Park" variant="status" status="away" size="lg" />

<AvatarGroup max={3} effect="stack">
  <Avatar name="Mina Park" />
  <Avatar name="Tomas Reyes" />
  <Avatar name="Aisha Khan" />
  <Avatar name="Leo Martin" />
</AvatarGroup>`,
  exports: ["Avatar", "AvatarGroup", "avatarTone", "getInitials"],
}
