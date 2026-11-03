import { useState } from "react"
import { Archive, Copy, Download, Forward, Link2, Reply, Share2, Trash2 } from "lucide-react"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/registry/miseui/ui/dropdown-menu"
import { ButtonGroup, ButtonGroupItem, ButtonGroupMenu } from "@/registry/miseui/ui/button-group"

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="max-w-full min-w-0">{children}</div>
    </div>
  )
}

function PublishGroup({ effect }: { effect?: "press" }) {
  const [message, setMessage] = useState("Draft, last edited today")
  return (
    <div className="grid min-w-0 gap-2">
      <ButtonGroup variant="split" aria-label="Publish" effect={effect}>
        <ButtonGroupItem onClick={() => setMessage("Published just now")}>Publish</ButtonGroupItem>
        <ButtonGroupMenu label="More publish options" effect="materialize">
          <DropdownMenuItem onSelect={() => setMessage("Scheduled for 9:00 tomorrow")}>Schedule for later</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMessage("Link copied for review")}>Share for review</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setMessage("Draft discarded")}>
            Discard draft
          </DropdownMenuItem>
        </ButtonGroupMenu>
      </ButtonGroup>
      <p role="status" className="text-[13px] text-muted-foreground">
        {message}
      </p>
    </div>
  )
}

function ReplyItems() {
  return (
    <>
      <ButtonGroupItem>
        <Reply aria-hidden="true" />
        Reply
      </ButtonGroupItem>
      <ButtonGroupItem>
        <Forward aria-hidden="true" />
        Forward
      </ButtonGroupItem>
    </>
  )
}

function PhotoItems() {
  return (
    <>
      <ButtonGroupItem>
        <Download aria-hidden="true" />
        Save
      </ButtonGroupItem>
      <ButtonGroupItem>
        <Share2 aria-hidden="true" />
        Share
      </ButtonGroupItem>
    </>
  )
}

function LinkItems() {
  return (
    <>
      <ButtonGroupItem>
        <Copy aria-hidden="true" />
        Copy text
      </ButtonGroupItem>
      <ButtonGroupItem>
        <Link2 aria-hidden="true" />
        Copy link
      </ButtonGroupItem>
    </>
  )
}

export function Demo() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Cell label="plain">
        <ButtonGroup variant="plain" aria-label="Message">
          <ReplyItems />
        </ButtonGroup>
      </Cell>
      <Cell label="outline">
        <ButtonGroup variant="outline" aria-label="Message">
          <ReplyItems />
          <ButtonGroupItem aria-label="Archive">
            <Archive aria-hidden="true" />
          </ButtonGroupItem>
        </ButtonGroup>
      </Cell>
      <Cell label="split, with a menu">
        <PublishGroup />
      </Cell>
      <Cell label="pill">
        <ButtonGroup variant="pill" aria-label="Photo">
          <PhotoItems />
          <ButtonGroupItem aria-label="Delete">
            <Trash2 aria-hidden="true" />
          </ButtonGroupItem>
        </ButtonGroup>
      </Cell>
      <Cell label="vertical, outline">
        <ButtonGroup variant="outline" orientation="vertical" aria-label="Link">
          <LinkItems />
        </ButtonGroup>
      </Cell>
      <Cell label="vertical, pill">
        <ButtonGroup variant="pill" orientation="vertical" aria-label="Photo">
          <PhotoItems />
        </ButtonGroup>
      </Cell>
      <Cell label="press effect, split">
        <PublishGroup effect="press" />
      </Cell>
      <Cell label="press effect, outline">
        <ButtonGroup variant="outline" aria-label="Message" effect="press">
          <ReplyItems />
        </ButtonGroup>
      </Cell>
    </div>
  )
}
