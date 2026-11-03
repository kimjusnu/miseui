import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "alert-dialog",
  title: "Alert Dialog",
  category: "overlays",
  description: "A question that has to be answered before anything else, with focus on the safe answer, a typed confirmation for the worst cases and a bottom sheet on phones.",
  why: {
    principle: "Error prevention",
    explanation:
      "People confirm out of habit, often with Enter before they have read a word. Focus starts on the safe answer, so that habit keeps the data, and an outside click does nothing, because a question this serious should not be answered by accident. On a phone the answer sits at the bottom edge, where a thumb already is.",
    avoid:
      "Do not ask for what can be undone: an undo toast costs less and interrupts nothing. Use it rarely, since every needless alert teaches people to dismiss the next one unread. For anything that is not a yes or no question, use Dialog.",
  },
  designs: [
    {
      name: "plain",
      principle: "Recognition over recall",
      use: "For a consequence that matters but is not destructive, such as signing out everywhere or leaving a page with unsaved work.",
    },
    {
      name: "destructive",
      principle: "Von Restorff effect",
      use: "When something will be lost for good: the warning mark and the red action slow the eye down before the click.",
    },
    {
      name: "typed",
      principle: "Desirable difficulty",
      use: "For the worst cases, such as deleting a workspace or production data. Typing the name proves the person is looking at the right one.",
    },
    {
      name: "compact",
      principle: "Hick's law",
      use: "For a quick confirmation with a short title and two one-word answers, such as discarding a draft.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Continuity",
      use: "When the alert should feel like it comes into focus, not snap on. It slides up as a sheet on phones and turns off for reduced motion.",
    },
  ],
  usage: `import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogConfirmField,
} from "@/components/ui/alert-dialog"

<AlertDialog variant="destructive" effect="materialize">
  <AlertDialogTrigger asChild><Button variant="outline">Delete project</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this project?</AlertDialogTitle>
      <AlertDialogDescription>Its 214 files go too. This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep project</AlertDialogCancel>
      <AlertDialogAction onClick={remove}>Delete project</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog variant="typed" confirmWord="north-star">
  ...
  <AlertDialogConfirmField />
  ...
</AlertDialog>`,
  exports: [
    "AlertDialog",
    "AlertDialogTrigger",
    "AlertDialogContent",
    "AlertDialogHeader",
    "AlertDialogTitle",
    "AlertDialogDescription",
    "AlertDialogConfirmField",
    "AlertDialogFooter",
    "AlertDialogAction",
    "AlertDialogCancel",
    "matchesConfirmation",
  ],
}
