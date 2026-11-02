import type * as React from "react"
import { useId, useState } from "react"
import { Button } from "@/registry/miseui/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/miseui/ui/card"
import { Input } from "@/registry/miseui/ui/input"
import { Label } from "@/registry/miseui/ui/label"

function EffectCard({ name, hint, ...props }: { name: string; hint: string } & React.ComponentProps<typeof Card>) {
  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="font-mono text-sm">{name}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export function Demo() {
  const nameId = useId()
  const [arrival, setArrival] = useState(0)
  return (
    <div className="flex w-full flex-col gap-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>New project</CardTitle>
          <CardDescription>Give it a name you will recognize in a month.</CardDescription>
          <CardAction>
            <Button variant="ghost" size="sm">
              Templates
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Label htmlFor={nameId}>Project name</Label>
          <Input id={nameId} placeholder="Quarterly report" />
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline">Cancel</Button>
          <Button variant="mise">Create</Button>
        </CardFooter>
      </Card>
      <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-3">
        <EffectCard effect="beam" name="beam" hint="The one card being written." />
        <EffectCard effect="spotlight" name="spotlight" hint="Light follows the pointer." />
        <EffectCard effect="tilt" name="tilt" hint="Turns toward the pointer." />
        <div className="flex min-h-36 flex-col gap-2">
          <EffectCard key={arrival} effect="materialize" name="materialize" hint="Comes into focus." />
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setArrival((value) => value + 1)}>
            Replay
          </Button>
        </div>
      </div>
    </div>
  )
}
