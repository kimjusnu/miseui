import type * as React from "react"
import { useState } from "react"
import { ImageCropper, type CropRect, type ImageCropperEffect, type ImageCropperVariant } from "@/registry/miseui/ui/image-cropper"

const SCENE_SIZE = { width: 800, height: 600 }

/** A drawn landscape, so the demo ships no image files. Fixed colours: this stands in for a photo, not for the interface. */
function Scene() {
  return (
    <svg aria-hidden="true" viewBox="0 0 800 600" className="block size-full">
      <defs>
        <linearGradient id="cropper-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f6c9a0" />
          <stop offset="0.6" stopColor="#f3e3c8" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#cropper-sky)" />
      <circle cx="560" cy="190" r="62" fill="#fbeed3" />
      <path d="M0 380 L150 230 L290 350 L420 200 L600 370 L720 280 L800 340 V600 H0Z" fill="#8a9bb0" />
      <path d="M0 450 L120 360 L260 440 L400 340 L560 450 L700 380 L800 430 V600 H0Z" fill="#5d7183" />
      <path d="M0 520 C160 470 320 540 480 500 C600 470 720 500 800 480 V600 H0Z" fill="#3a4a58" />
      <path d="M190 520 L204 470 L218 520Z M250 530 L268 462 L286 530Z M610 505 L626 450 L642 505Z" fill="#26323c" />
    </svg>
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

function Cropper({ variant, effect, aspect }: { variant: ImageCropperVariant; effect?: ImageCropperEffect; aspect?: number }) {
  const [crop, setCrop] = useState<CropRect | null>(null)
  return (
    <div className="grid min-w-0 gap-2">
      <ImageCropper label={`Landscape, ${variant} crop`} imageSize={SCENE_SIZE} variant={variant} effect={effect} aspect={aspect} onCropChange={setCrop}>
        <Scene />
      </ImageCropper>
      <p className="text-[13px] text-muted-foreground tabular-nums">{crop ? `Starts at ${crop.x}, ${crop.y}` : "Waiting for the image"}</p>
    </div>
  )
}

const VARIANTS: readonly ImageCropperVariant[] = ["free", "square", "circle", "wide"]

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {VARIANTS.map((variant) => (
        <Cell key={variant} label={variant}>
          <Cropper variant={variant} />
        </Cell>
      ))}
      <Cell label="spring effect, drag past an edge and let go">
        <Cropper variant="square" effect="spring" />
      </Cell>
      <Cell label="free, locked to 3:2 with the aspect prop">
        <Cropper variant="free" aspect={3 / 2} />
      </Cell>
    </div>
  )
}
