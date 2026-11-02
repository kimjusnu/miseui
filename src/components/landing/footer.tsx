import { Link } from "react-router"
import { GITHUB_URL, SITE_URL } from "@/src/lib/site"

export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 md:px-10 text-sm text-muted-foreground">
        <p>
          <span className="text-title text-base text-foreground">Mise</span> UI. MIT licensed, built in the open.
        </p>
        <nav aria-label="Footer" className="flex gap-5">
          <Link className="hover:text-foreground" to="/docs">
            Docs
          </Link>
          <a className="hover:text-foreground" href={GITHUB_URL}>
            GitHub
          </a>
          <a className="hover:text-foreground" href={`${SITE_URL}/llms.txt`}>
            llms.txt
          </a>
        </nav>
      </div>
    </footer>
  )
}
