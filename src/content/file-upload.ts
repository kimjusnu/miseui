import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "file-upload",
  title: "File Upload",
  category: "forms",
  description: "A real drop zone and file input with limits, clear errors and a progress list, and no network code of its own.",
  why: {
    principle: "Error prevention",
    explanation:
      "Saying the limits before someone chooses a file, and checking them the moment the file lands, saves a long upload that was always going to fail. Each rejected file gets its own sentence saying why, so nobody has to guess which of ten went wrong.",
    avoid:
      "Do not rely on these checks for security: a browser can be told anything, so your server must check again. Do not use a large drop zone where only one small file is ever needed.",
  },
  designs: [
    {
      name: "dropzone",
      principle: "Fitts's law",
      use: "When files are the main task, such as attaching documents: the target is as large as the job and takes a drag from anywhere on it.",
    },
    {
      name: "button",
      principle: "Familiarity",
      use: "When uploading is a side action on a busy screen and a large empty box would compete with the content.",
    },
    {
      name: "compact",
      principle: "Consistency",
      use: "Inside a form, where it should have the height of the inputs around it and list files in tight rows.",
    },
    {
      name: "avatar",
      principle: "Immediate feedback",
      use: "For a profile picture: the result appears in the place it will live, with progress running around it.",
    },
  ],
  effects: [
    {
      name: "materialize",
      principle: "Object constancy",
      use: "When files come and go often: a row grows in and a removed one closes the gap, so the list never jumps under the pointer.",
    },
  ],
  usage: `import { FileUpload } from "@/components/ui/file-upload"

const [items, setItems] = useState([])

<FileUpload
  accept="image/*,.pdf"
  maxSize={5 * 1024 * 1024}
  maxFiles={4}
  multiple
  hint="Images or PDF, up to 5 MB"
  items={items}
  onFilesAccepted={(files) => startUploads(files, setItems)}
  onRemove={(id) => setItems((rows) => rows.filter((row) => row.id !== id))}
/>`,
  exports: ["FileUpload"],
}
