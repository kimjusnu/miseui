import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "qr-code",
  title: "QR Code",
  category: "display",
  description: "A QR code encoder written from scratch and drawn as crisp SVG with a quiet zone, in square, dotted, framed and logo forms, always dark on light so it scans.",
  why: {
    principle: "Reducing interaction cost",
    explanation:
      "Typing a URL from one screen into a phone is slow and error-prone. A code turns that into one glance through a camera, and the error correction means a smudge or a small logo does not break it. Everything that keeps it scanning, the quiet zone and the dark-on-light contrast, is fixed so a theme cannot take it away.",
    avoid:
      "Do not make someone already on a phone scan their own screen; give them a link as well. Do not encode long text, since denser symbols need a bigger print and a steadier hand.",
  },
  designs: [
    {
      name: "plain",
      principle: "Signal over decoration",
      use: "When reliability is all that matters: tickets, printed labels, small sizes.",
    },
    {
      name: "rounded",
      principle: "Aesthetic-usability effect",
      use: "On a marketing page or a menu, where the code should feel part of the design. Keep it at 120 px or more.",
    },
    {
      name: "framed",
      principle: "Law of common region",
      use: "When people need to know what they get before scanning: the caption and the code read as one object.",
    },
    {
      name: "logo",
      principle: "Recognition over recall",
      use: "When a familiar mark gives people the confidence to scan. It forces level H, which makes the symbol denser, so give it more room.",
    },
  ],
  effects: [
    {
      name: "reveal",
      principle: "Attention through motion",
      use: "When the code appears as a result, such as after pressing Share. The clip is removed as soon as it ends, so a camera never sees it.",
    },
  ],
  usage: `import { QrCode } from "@/components/ui/qr-code"

<QrCode value="https://example.com/menu" label="Open the menu" />

<QrCode value="https://example.com/menu" variant="framed" caption="Scan for the menu" effect="reveal" size={160} />

<QrCode value="https://example.com/menu" variant="logo" logo={<Coffee />} />`,
  exports: ["QrCode"],
}
