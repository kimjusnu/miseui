import { Link, Outlet, useLocation } from "react-router"
import { cn } from "@/registry/miseui/lib/utils"
import { Button } from "@/registry/miseui/ui/button"
import { GITHUB_URL } from "@/src/lib/site"
import { GitHubIcon } from "./github-icon"
import { Sidebar } from "./sidebar"
import { ThemeToggle } from "./theme-toggle"

export function Brand() {
  return (
    <Link
      to="/"
      className="text-title rounded-md text-[19px] whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      Mise<span className="text-muted-foreground"> UI</span>
    </Link>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const isFullBleed = pathname === "/" || pathname === "/blocks"

  return (
    <div className={cn("min-h-dvh", isFullBleed && "bg-muted")}>
      <header className="material sticky top-0 z-20 text-foreground">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 md:px-6">
          <Brand />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/blocks">Blocks</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link to="/components/thinking-indicator">Components</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/docs">Docs</Link>
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" aria-label="GitHub repository">
                <GitHubIcon />
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      {isFullBleed ? (
        <Outlet />
      ) : (
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-[200px_1fr]">
          <aside className="md:sticky md:top-24 md:max-h-[calc(100dvh-7rem)] md:self-start md:overflow-y-auto md:[scrollbar-width:none]">
            <Sidebar />
          </aside>
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      )}
    </div>
  )
}
