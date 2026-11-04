# Logo Wall

Logos you have permission to show, in three decisions: a quiet row, a plate for each, or a marquee for more than fit. The marks in this preview are dashed placeholders and stand for no real company.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/logo-wall.json
```

## Why it looks like this

**Social proof.** When people are unsure, they look at what others like them have already done. A familiar name answers the question a claim cannot, which is whether anyone real uses this. Flattening every logo to one colour keeps a set of unrelated brands from fighting the page, and it lets the names do the work rather than the colours.

**Don't.** Never show a logo you do not have permission to use, and never invent one. A wall of names nobody recognises persuades nobody, and a made-up logo found out costs more trust than an empty space. With no logos yet, leave the block out; the placeholders are for building the page, not for shipping it.

## Designs

Pass one as the `variant` prop.

- `row` (Social proof): A few well-known names directly under a hero: quick evidence, one line, then back to the product.
- `grid` (Equal weight): The list itself is the point, as on a customers or partners page, and no logo should look more important than another.
- `marquee` (Perceived abundance): You have more logos than fit in a line and none needs reading closely. It pauses on hover, on focus and from its own button, and stands still under reduced motion.

## Usage

```tsx
import { LogoWall, placeholderLogos } from "@/components/logo-wall"

<LogoWall
  title="Used by teams like yours."
  logos={[
    { name: "Your customer", src: "/logos/your-customer.svg" },
    { name: "Another customer", src: "/logos/another.svg", href: "/stories/another" },
  ]}
/>

// A plate for each, for a customers page
<LogoWall variant="grid" logos={logos} />

// More than fit. A longer list needs a longer duration, to keep the same speed.
<LogoWall variant="marquee" logos={logos} duration={40} />

// Building the page before you have permission: dashed marks nobody can mistake for a customer
<LogoWall logos={placeholderLogos(6)} title="Placeholder marks." />
```

Exports: `LogoWall`, `LogoPlaceholder`, `placeholderLogos`
