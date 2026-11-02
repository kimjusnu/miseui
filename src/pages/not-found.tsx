import { Link } from "react-router"
import { Button } from "@/registry/miseui/ui/button"

export function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4 py-10">
      <p className="text-display text-4xl">Nothing is placed here.</p>
      <p className="text-muted-foreground">The page you asked for does not exist.</p>
      <Button variant="outline" asChild>
        <Link to="/">Back to the start</Link>
      </Button>
    </div>
  )
}
