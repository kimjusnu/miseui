import type * as React from "react"
import { useId, useState } from "react"
import { LayoutGroup, useReducedMotion } from "motion/react"
import {
  DotsView,
  LoadMoreView,
  NumbersView,
  SimpleView,
  type PageViewProps,
} from "@/registry/miseui/ui/pagination-views"
import { getDotWindow, getPageWindow, type PageSlot } from "@/registry/miseui/ui/pagination-window"
import { cn } from "@/registry/miseui/lib/utils"

type PaginationVariant = "numbers" | "simple" | "dots" | "load-more"
type PaginationEffect = "spring"

const DEFAULT_PAGE_SIZE = 24

interface PaginationProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
  /** `numbers` a page window, `simple` previous and next around "Page 3 of 12", `dots` for carousels, `load-more` a button with a running count. */
  variant?: PaginationVariant
  /** `spring` slides the active page indicator between pages. */
  effect?: PaginationEffect
  page?: number
  defaultPage?: number
  onPageChange?: (page: number) => void
  /** Number of pages. Derived from `itemCount` and `pageSize` when left out. */
  pageCount?: number
  /** `numbers`: pages either side of the current one. Use 0 in tight spaces. */
  siblings?: number
  boundaries?: number
  /** `load-more`: total items, for "Showing 24 of 60". */
  itemCount?: number
  pageSize?: number
  /** `load-more`: the next page is on its way. */
  loading?: boolean
}

interface BodyProps extends PageViewProps {
  variant: PaginationVariant
  siblings?: number
  boundaries?: number
  itemCount: number
  pageSize: number
  loading: boolean
}

function PaginationBody({ variant, siblings, boundaries, itemCount, pageSize, loading, ...view }: BodyProps) {
  if (variant === "simple") return <SimpleView {...view} />
  if (variant === "dots") return <DotsView {...view} />
  if (variant === "load-more") {
    return (
      <LoadMoreView
        page={view.page}
        pageCount={view.pageCount}
        goTo={view.goTo}
        itemCount={itemCount}
        pageSize={pageSize}
        loading={loading}
      />
    )
  }
  return <NumbersView {...view} siblings={siblings} boundaries={boundaries} />
}

function usePageState(props: Pick<PaginationProps, "page" | "defaultPage" | "onPageChange">, pageCount: number) {
  const [uncontrolled, setUncontrolled] = useState(props.defaultPage ?? 1)
  const page = Math.min(Math.max(pageCount, 1), Math.max(1, props.page ?? uncontrolled))
  const goTo = (next: number) => {
    setUncontrolled(next)
    props.onPageChange?.(next)
  }
  return { page, goTo }
}

function Pagination({
  variant = "numbers",
  effect,
  page: pageProp,
  defaultPage,
  onPageChange,
  pageCount: pageCountProp,
  siblings,
  boundaries,
  itemCount,
  pageSize = DEFAULT_PAGE_SIZE,
  loading = false,
  className,
  "aria-label": ariaLabel = "Pagination",
  ...props
}: PaginationProps) {
  const groupId = useId()
  const reduceMotion = useReducedMotion() ?? false
  const pageCount = Math.max(0, pageCountProp ?? Math.ceil((itemCount ?? 0) / Math.max(1, pageSize)))
  const { page, goTo } = usePageState({ page: pageProp, defaultPage, onPageChange }, pageCount)
  const body = (
    <PaginationBody
      variant={variant}
      page={page}
      pageCount={pageCount}
      goTo={goTo}
      indicator={effect === "spring" && !reduceMotion ? "slide" : "static"}
      siblings={siblings}
      boundaries={boundaries}
      itemCount={itemCount ?? pageCount * pageSize}
      pageSize={pageSize}
      loading={loading}
    />
  )
  return (
    <nav
      aria-label={ariaLabel}
      data-slot="pagination"
      data-variant={variant}
      data-effect={effect}
      className={cn("flex justify-center", className)}
      {...props}
    >
      {/* layoutId is global to the page; without a per-instance group two paginations would share one indicator. */}
      {effect === "spring" ? <LayoutGroup id={groupId}>{body}</LayoutGroup> : body}
    </nav>
  )
}

export {
  Pagination,
  getPageWindow,
  getDotWindow,
  type PageSlot,
  type PaginationProps,
  type PaginationVariant,
  type PaginationEffect,
}
