# Kbd

Keyboard keys as hairline caps, physical keys, tight chips or plain text, with chords, a platform-aware modifier and a cap that dips on the real key.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/kbd.json
```

## Why it looks like this

**Flexibility and efficiency of use.** A shortcut shown next to the action teaches itself: people learn it by seeing it each time they click. Drawing it as a key, in the words of their own keyboard, makes it read as something to press instead of a code to decode.

**Don't.** Do not show a shortcut you have not wired up, or one the browser already owns. Do not hardcode Ctrl or the Command mark; a wrong modifier teaches the wrong key, so use Mod.

## Designs

Pass one as the `variant` prop.

- `plain` (Signifiers): Inline in help text and tooltips, where a hairline outline marks it as a key without interrupting the sentence.
- `raised` (Skeuomorphic affordance): In onboarding and shortcut sheets, where the key itself is the subject and should look pressable.
- `flat` (Visual hierarchy): In tight rows such as a search field hint, where a small filled chip stays behind the main text.
- `ghost` (Signal to noise): At the end of menu rows, where a dozen outlined keys would compete with the labels.

## Effects

Pass one as the `effect` prop.

- `press` (Immediate feedback): On a shortcut sheet or tutorial: the cap dips the instant the real key goes down, which proves the key is the right one.

## Usage

```tsx
import { Kbd, KbdGroup, Mod } from "@/components/ui/kbd"

<KbdGroup variant="flat">
  <Mod />
  <Kbd>K</Kbd>
</KbdGroup>

<KbdGroup separator="then" variant="raised" effect="press">
  <Kbd>G</Kbd>
  <Kbd>I</Kbd>
</KbdGroup>

<Kbd effect="press" keyName="Enter"><CornerDownLeft /></Kbd>
```

Exports: `Kbd`, `KbdGroup`, `Mod`, `isApplePlatform`, `keyMatches`
