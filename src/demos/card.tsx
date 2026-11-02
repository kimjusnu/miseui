import { useId } from "react"
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

export function Demo() {
  const nameId = useId()
  return (
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
  )
}
