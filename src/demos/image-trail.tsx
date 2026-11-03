import type * as React from "react"
import { ImageTrail, type ImageTrailProps } from "@/registry/miseui/ui/image-trail"

/** Landscapes painted with CSS. These are pictures, so they keep their own colours whatever the theme. */
const SCENES: readonly string[] = [
  "radial-gradient(circle at 70% 28%, #fff4d2 0 9%, transparent 10%), linear-gradient(#a9c6da 0 46%, #2f5d73 46% 100%)",
  "radial-gradient(120% 60% at 20% 100%, #47654e 60%, transparent 61%), radial-gradient(120% 75% at 85% 100%, #7c9a7a 60%, transparent 61%), linear-gradient(#e2eae4, #bdd0c6)",
  "radial-gradient(circle at 30% 62%, #ffd8a8 0 10%, transparent 11%), linear-gradient(#2c3553, #a8606a 66%, #e9a66b)",
  "linear-gradient(168deg, #efe3cf 0 56%, #d4b98f 56% 72%, #bb9a6c 72%)",
  "radial-gradient(90% 50% at 50% 100%, #26423a 60%, transparent 61%), repeating-linear-gradient(90deg, #355a49 0 8px, #4a7360 8px 18px)",
  "radial-gradient(circle at 26% 30%, #fbfaf4 0 12%, transparent 13%), linear-gradient(#c7d8e6, #eef0ea 70%, #d9cfc0)",
]

const PICTURES = SCENES.map((background) => <div key={background} style={{ background }} />)

function Box(props: Partial<ImageTrailProps>) {
  return (
    <ImageTrail items={PICTURES} size={80} spacing={64} className="h-64 rounded-lg border bg-card" {...props}>
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center">
        <p className="text-[15px] font-medium text-foreground">Places we walked this year</p>
        <p className="text-[13px] text-muted-foreground">Move across this box.</p>
      </div>
    </ImageTrail>
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="trail: pop in, fade in order">
        <Box variant="trail" />
      </Cell>
      <Cell label="pile: stay until the pointer rests">
        <Box variant="pile" spacing={48} />
      </Cell>
      <Cell label="fan: seeded angles, like dealt cards">
        <Box variant="fan" />
      </Cell>
      <Cell label="strip: upright frames along the path">
        <Box variant="strip" spacing={72} />
      </Cell>
      <Cell label="speed effect: sweep fast, then drift slowly">
        <Box variant="trail" effect="speed" />
      </Cell>
      <Cell label="speed effect on a fan">
        <Box variant="fan" effect="speed" />
      </Cell>
    </div>
  )
}
