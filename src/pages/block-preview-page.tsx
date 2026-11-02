import { Suspense } from "react"
import { useParams } from "react-router"
import { findComponent } from "@/src/content"
import { demos } from "@/src/demos"
import { NotFound } from "./not-found"

/** One block, alone, at the full window: for opening in a new tab, and what the gallery captures are taken from. */
export function BlockPreviewPage() {
  const { name = "" } = useParams()
  const meta = findComponent(name)
  const Demo = demos[name]
  if (!Demo || meta?.category !== "blocks") return <NotFound />
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground [&>*]:flex-1">
      <Suspense fallback={null}>
        <Demo />
      </Suspense>
    </main>
  )
}
