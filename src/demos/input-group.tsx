import { useState } from "react"
import { AtSign, Copy, Search, X } from "lucide-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupSelect,
} from "@/registry/miseui/ui/input-group"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

function CurrencyOptions() {
  return (
    <>
      <option value="usd">USD</option>
      <option value="eur">EUR</option>
      <option value="krw">KRW</option>
    </>
  )
}

function SearchField() {
  const [query, setQuery] = useState("invoices")
  return (
    <InputGroup variant="inset" label="Search">
      <InputGroupAddon>
        <Search aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search files" value={query} onChange={(event) => setQuery(event.target.value)} />
      {query ? (
        <InputGroupButton aria-label="Clear search" onClick={() => setQuery("")}>
          <X aria-hidden="true" />
        </InputGroupButton>
      ) : null}
    </InputGroup>
  )
}

function CouponField() {
  const [code, setCode] = useState("WELCOME")
  const invalid = code.trim() === ""
  return (
    <div className="grid gap-2">
      <InputGroup label="Coupon code">
        <InputGroupInput value={code} aria-invalid={invalid} onChange={(event) => setCode(event.target.value)} placeholder="Enter a code" />
        <InputGroupButton disabled={invalid}>Apply</InputGroupButton>
      </InputGroup>
      {invalid ? <p className="text-[13px] leading-5 text-destructive">A coupon code is required.</p> : null}
    </div>
  )
}

function States() {
  return (
    <>
      <Cell label="primary action">
        <InputGroup label="Email for updates">
          <InputGroupInput type="email" placeholder="you@example.com" />
          <InputGroupButton primary>Subscribe</InputGroupButton>
        </InputGroup>
      </Cell>
      <Cell label="error on the shared border">
        <CouponField />
      </Cell>
      <Cell label="disabled">
        <InputGroup label="Domain" disabled>
          <InputGroupInput defaultValue="northstar" />
          <InputGroupAddon>.example.com</InputGroupAddon>
        </InputGroup>
      </Cell>
    </>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="attached, text and button">
        <InputGroup label="Website">
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput placeholder="yoursite.com" />
          <InputGroupButton>Check</InputGroupButton>
        </InputGroup>
      </Cell>
      <Cell label="attached, select and value">
        <InputGroup label="Price">
          <InputGroupSelect aria-label="Currency" defaultValue="usd">
            <CurrencyOptions />
          </InputGroupSelect>
          <InputGroupInput inputMode="decimal" placeholder="0.00" />
        </InputGroup>
      </Cell>
      <Cell label="inset, icon and clear">
        <SearchField />
      </Cell>
      <Cell label="inset, copy">
        <InputGroup variant="inset" label="Invite link">
          <InputGroupInput readOnly defaultValue="team.example.com/join/k3f9" />
          <InputGroupButton aria-label="Copy invite link">
            <Copy aria-hidden="true" />
          </InputGroupButton>
        </InputGroup>
      </Cell>
      <Cell label="stacked">
        <InputGroup variant="stacked" label="Monthly budget">
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput inputMode="decimal" placeholder="0.00" defaultValue="1,200" />
          <InputGroupSelect aria-label="Currency" defaultValue="usd">
            <CurrencyOptions />
          </InputGroupSelect>
        </InputGroup>
      </Cell>
      <Cell label="inline">
        <div className="grid gap-2">
          <InputGroup variant="inline" label="Username">
            <InputGroupAddon>
              <AtSign aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput defaultValue="minapark" />
          </InputGroup>
          <InputGroup variant="inline" label="Weight">
            <InputGroupInput inputMode="decimal" defaultValue="62" />
            <InputGroupAddon>kg</InputGroupAddon>
          </InputGroup>
        </div>
      </Cell>
      <States />
    </div>
  )
}
