# Image Cropper

Frame a picture by dragging, pinching or scrolling, with keyboard nudges and an aspect lock. The crop it returns can never leave the image.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/image-cropper.json
```

## Why it looks like this

**Direct manipulation.** People understand a crop by moving the picture with their hand, not by typing coordinates. Everything outside the frame dims, so the result is visible before anyone commits to it, and the geometry refuses any position that would show empty space, so there is no wrong answer to recover from.

**Don't.** Do not ask for a crop when any part of the picture will do; centre it automatically and offer this as an edit. Do not use it to resize: it chooses which pixels to keep, and your server still decides the final size.

## Designs

Pass one as the `variant` prop.

- `free` (User control and freedom): Screenshots and documents where the shape is unknown: pull any corner, and hold Shift to keep the shape for one drag. Set `aspect` to lock it.
- `square` (Rule of thirds): Product photos and thumbnails with a fixed shape. Guide lines appear only while dragging, when they help, and leave when they would be clutter.
- `circle` (Fidelity to the result): Profile pictures: the mask shows the round shape it will really be seen in, so nobody learns afterwards that their chin was cut off.
- `wide` (Closure): Cover images and banners. The band runs edge to edge with only two lines marking it, and the eye completes the rest.

## Effects

Pass one as the `effect` prop.

- `spring` (Rubber banding): Touch-first screens: dragging past an edge follows with growing resistance and springs back on release, so the limit is felt instead of the picture simply stopping.

## Usage

```tsx
import { ImageCropper, cropToBlob } from "@/components/ui/image-cropper"

const [crop, setCrop] = useState(null)

<ImageCropper
  label="Profile picture"
  src={photoUrl}
  variant="circle"
  effect="spring"
  onCropChange={setCrop}
/>

// When saving: pass the loaded image element.
const blob = await cropToBlob(imageElement, crop, { type: "image/jpeg", quality: 0.9 })
```

Exports: `ImageCropper`, `cropToBlob`
