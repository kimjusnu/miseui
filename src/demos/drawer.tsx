import { Button } from "@/registry/miseui/ui/button"
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  type DrawerProps,
  type DrawerSide,
} from "@/registry/miseui/ui/drawer"

const SIDES: readonly DrawerSide[] = ["left", "right", "top", "bottom"]

const INVOICE_FILTERS = ["Unpaid", "Overdue", "Paid this month", "Refunded"]

function FiltersDrawer({ label, ...props }: DrawerProps & { label: string }) {
  return (
    <Drawer {...props}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          {label}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Filter invoices</DrawerTitle>
          <DrawerDescription>Pick what to show in the list behind this panel.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>
          <ul className="grid gap-1">
            {INVOICE_FILTERS.map((filter) => (
              <li key={filter} className="flex min-h-10 items-center border-b border-border last:border-b-0">
                {filter}
              </li>
            ))}
          </ul>
        </DrawerBody>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="mise" size="sm">
              Apply filters
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function NotesDrawer() {
  return (
    <Drawer variant="split">
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          split
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Meeting notes</DrawerTitle>
          <DrawerDescription>The page stays clickable while this is open. Press Escape or the corner button to close.</DrawerDescription>
        </DrawerHeader>
        <DrawerBody>Follow up with finance about the March invoices, and move the renewal call to Thursday.</DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

export function Demo() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">designs</p>
        <div className="flex flex-wrap gap-2">
          <FiltersDrawer label="plain" />
          <FiltersDrawer label="floating" variant="floating" />
          <NotesDrawer />
          <FiltersDrawer label="sheet" variant="sheet" />
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">sides</p>
        <div className="flex flex-wrap gap-2">
          {SIDES.map((side) => (
            <FiltersDrawer key={side} label={side} side={side} />
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">push effect</p>
        <div className="flex flex-wrap gap-2">
          <FiltersDrawer label="push, plain" effect="push" />
          <FiltersDrawer label="push, floating" variant="floating" effect="push" />
        </div>
      </div>
    </div>
  )
}
