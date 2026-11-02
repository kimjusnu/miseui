import { useEffect, useRef, useState } from "react"
import { File, Folder } from "lucide-react"
import { TreeView, type TreeNode } from "@/registry/miseui/ui/tree-view"

const FILES: readonly TreeNode[] = [
  {
    id: "src",
    label: "src",
    icon: <Folder />,
    children: [
      { id: "app", label: "App.tsx", icon: <File /> },
      {
        id: "pages",
        label: "pages",
        icon: <Folder />,
        children: [
          { id: "home", label: "home.tsx", icon: <File /> },
          { id: "billing", label: "billing.tsx", icon: <File /> },
        ],
      },
    ],
  },
  { id: "public", label: "public", icon: <Folder />, children: [{ id: "logo", label: "logo.svg", icon: <File /> }] },
  { id: "package", label: "package.json", icon: <File /> },
  { id: "lock", label: "pnpm-lock.yaml", icon: <File />, disabled: true },
]

const PROJECTS: readonly TreeNode[] = [
  {
    id: "website",
    label: "Website redesign",
    children: [
      { id: "research", label: "Research" },
      { id: "copy", label: "Page copy" },
    ],
  },
  {
    id: "launch",
    label: "Spring launch",
    children: [
      { id: "press", label: "Press kit" },
      { id: "emails", label: "Email sequence" },
    ],
  },
]

const LOAD_MS = 900
const LAZY_ROOT: TreeNode = { id: "archive", label: "2025 archive", icon: <Folder />, lazy: true }
const LOADED: readonly TreeNode[] = [
  { id: "q1", label: "First quarter.pdf", icon: <File /> },
  { id: "q2", label: "Second quarter.pdf", icon: <File /> },
]

/** The timer stands in for your request; nothing here leaves the browser. */
function LazyTree() {
  const [children, setChildren] = useState<readonly TreeNode[] | undefined>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <TreeView
      aria-label="Archive, loads on open"
      nodes={[{ ...LAZY_ROOT, children }]}
      effect="spring"
      loadingLabel="Loading files"
      onExpandedChange={(_, change) => {
        if (!change.expanded || children) return
        timer.current = setTimeout(() => setChildren(LOADED), LOAD_MS)
      }}
    />
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">plain, single selection, spring effect</p>
        <TreeView aria-label="Project files" nodes={FILES} selectionMode="single" effect="spring" defaultExpanded={["src"]} defaultSelected={["app"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">lines</p>
        <TreeView aria-label="Project files with guides" nodes={FILES} variant="lines" defaultExpanded={["src", "pages"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">compact, several at once</p>
        <TreeView aria-label="Choose files" nodes={FILES} variant="compact" selectionMode="multiple" defaultExpanded={["src"]} defaultSelected={["package"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2">
        <p className="text-xs text-muted-foreground">card</p>
        <TreeView aria-label="Projects" nodes={PROJECTS} variant="card" defaultExpanded={["website"]} />
      </div>
      <div className="grid min-w-0 content-start gap-2 sm:col-span-2">
        <p className="text-xs text-muted-foreground">lazy children: open it</p>
        <LazyTree />
      </div>
    </div>
  )
}
