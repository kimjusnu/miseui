import { NavLink } from "react-router"
import { byCategory } from "@/src/content"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/src/content/types"
import { cn } from "@/registry/miseui/lib/utils"

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "block rounded-md px-2.5 py-1.5 text-sm transition-colors duration-(--duration-fast) ease-(--ease-mise)",
    isActive ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
  )

export function Sidebar() {
  return (
    <nav aria-label="Components" className="flex flex-col gap-6">
      <div>
        <NavLink to="/docs" className={linkClass}>
          Getting started
        </NavLink>
      </div>
      {CATEGORY_ORDER.map((category) => {
        const items = byCategory(category)
        if (items.length === 0) return null
        return (
          <div key={category}>
            <p className="mb-1.5 px-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {CATEGORY_LABELS[category]}
            </p>
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => (
                <li key={item.name}>
                  <NavLink to={`/components/${item.name}`} className={linkClass}>
                    {item.title}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
