import type * as React from "react"
import { TiltedCard, TiltLayer } from "@/registry/miseui/ui/tilted-card"

function RidgePicture() {
  return (
    <svg viewBox="0 0 320 240" className="block h-auto w-full" role="img" aria-label="Three ridge lines fading into a pale evening sky">
      <defs>
        <linearGradient id="tilted-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6e4" />
          <stop offset="0.65" stopColor="#ecdfd2" />
          <stop offset="1" stopColor="#f3d9bd" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" fill="url(#tilted-sky)" />
      <circle cx="226" cy="108" r="20" fill="#fbf1e4" />
      <path d="M0 150 C40 128 70 136 104 118 C140 100 170 132 208 124 C250 116 280 96 320 112 V240 H0 Z" fill="#a9b6c7" />
      <path d="M0 178 C50 160 84 176 130 156 C172 138 204 170 248 160 C276 154 298 146 320 150 V240 H0 Z" fill="#74869c" />
      <path d="M0 210 C60 190 104 208 160 192 C214 176 262 204 320 186 V240 H0 Z" fill="#435268" />
    </svg>
  )
}

function Barcode() {
  return (
    <div
      aria-hidden="true"
      className="h-8 w-full opacity-80"
      style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--foreground) 0 2px, transparent 2px 5px, var(--foreground) 5px 6px, transparent 6px 9px, var(--foreground) 9px 12px, transparent 12px 14px)" }}
    />
  )
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 content-start gap-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mx-auto w-full max-w-xs min-w-0">{children}</div>
    </div>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="photo">
        <TiltedCard
          variant="photo"
          caption={
            <>
              <span className="block font-medium">Evening ridge</span>
              <span className="block text-xs text-muted-foreground">1,240 m, looking west</span>
            </>
          }
        >
          <RidgePicture />
        </TiltedCard>
      </Cell>
      <Cell label="glare">
        <TiltedCard variant="glare">
          <div className="grid gap-8 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-medium">Reading room</p>
              <p className="text-xs text-muted-foreground tabular-nums">No. 0412</p>
            </div>
            <div className="grid gap-1">
              <p className="text-[13px] text-muted-foreground">Member since 2023</p>
              <p className="font-mono text-[13px] tracking-wide tabular-nums">4021 7786 1190</p>
            </div>
          </div>
        </TiltedCard>
      </Cell>
      <Cell label="layers">
        <TiltedCard variant="layers">
          <div className="grid gap-3 p-4">
            <TiltLayer depth={12} className="rounded-lg bg-mise-soft p-3">
              <svg viewBox="0 0 200 64" aria-hidden="true" className="block h-auto w-full">
                <path d="M0 52 C24 48 36 30 60 34 C86 38 96 54 122 42 C148 30 160 12 200 8" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </TiltLayer>
            <TiltLayer depth={28}>
              <p className="text-[15px] font-medium">Morning brief</p>
              <p className="text-[13px] text-muted-foreground">Three things changed overnight.</p>
            </TiltLayer>
            <TiltLayer depth={44} className="w-fit rounded-full bg-background px-3 py-1 text-xs shadow-sm ring-1 ring-border">
              8 min read
            </TiltLayer>
          </div>
        </TiltedCard>
      </Cell>
      <Cell label="pass, drag effect: hold it with a finger">
        <TiltedCard
          variant="pass"
          effect="drag"
          stub={<Barcode />}
          finePrint="Not transferable. Doors open at 18:30."
        >
          <div className="grid gap-3">
            <p className="text-[15px] font-medium">Design systems evening</p>
            <dl className="grid grid-cols-3 gap-3 text-[13px]">
              <div>
                <dt className="text-xs text-muted-foreground">Hall</dt>
                <dd className="tabular-nums">B</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Row</dt>
                <dd className="tabular-nums">4</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Seat</dt>
                <dd className="tabular-nums">12</dd>
              </div>
            </dl>
          </div>
        </TiltedCard>
      </Cell>
    </div>
  )
}
