import { createContext } from "react"

type TableVariant = "plain" | "striped" | "card" | "compact"

interface TableContextValue {
  variant: TableVariant
  sticky: boolean
  spring: boolean
}

const TableContext = createContext<TableContextValue>({ variant: "plain", sticky: false, spring: false })

export { TableContext, type TableVariant }
