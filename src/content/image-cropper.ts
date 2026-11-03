import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "image-cropper",
  title: "Image Cropper",
  category: "forms",
  description: "Frame a picture by dragging, pinching or scrolling, with keyboard nudges and an aspect lock. The crop it returns can never leave the image.",
  why: {
    principle: "Direct manipulation",
    explanation:
      "People understand a crop by moving the picture with their hand, not by typing coordinates. Everything outside the frame dims, so the result is visible before anyone commits to it, and the geometry refuses any position that would show empty space, so there is no wrong answer to recover from.",
    avoid:
      "Do not ask for a crop when any part of the picture will do; centre it automatically and offer this as an edit. Do not use it to resize: it chooses which pixels to keep, and your server still decides the final size.",
  },
  designs: [
    {
      name: "free",
      principle: "User control and freedom",
      use: "Screenshots and documents where the shape is unknown: pull any corner, and hold Shift to keep the shape for one drag. Set `aspect` to lock it.",
    },
    {
      name: "square",
      principle: "Rule of thirds",
      use: "Product photos and thumbnails with a fixed shape. Guide lines appear only while dragging, when they help, and leave when they would be clutter.",
    },
    {
      name: "circle",
      principle: "Fidelity to the result",
      use: "Profile pictures: the mask shows the round shape it will really be seen in, so nobody learns afterwards that their chin was cut off.",
    },
    {
      name: "wide",
      principle: "Closure",
      use: "Cover images and banners. The band runs edge to edge with only two lines marking it, and the eye completes the rest.",
    },
  ],
  effects: [
    {
      name: "spring",
      principle: "Rubber banding",
      use: "Touch-first screens: dragging past an edge follows with growing resistance and springs back on release, so the limit is felt instead of the picture simply stopping.",
    },
  ],
  usage: `import { ImageCropper, cropToBlob } from "@/components/ui/image-cropper"

const [crop, setCrop] = useState(null)

<ImageCropper
  label="Profile picture"
  src={photoUrl}
  variant="circle"
  effect="spring"
  onCropChange={setCrop}
/>

// When saving: pass the loaded image element.
const blob = await cropToBlob(imageElement, crop, { type: "image/jpeg", quality: 0.9 })`,
  exports: ["ImageCropper", "cropToBlob"],
}
