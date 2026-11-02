# Password Input

A password field with a reveal button and a caps lock hint, plus a strength meter, a live checklist or a meter on the field edge.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/password-input.json
```

## Why it looks like this

**Error prevention.** Masked text hides typing mistakes, so people fail on the next screen and blame themselves. Reveal and the caps lock hint catch those errors before submit. The meter replaces a rejection afterwards with feedback while they type, and it weighs length over symbols because length is what actually slows an attacker.

**Don't.** Do not treat the score as security. It has no dictionary, so a long common phrase scores too high; check breached passwords on the server. Do not show a meter on a login form, where the password already exists, and do not block paste.

## Designs

Pass one as the `variant` prop.

- `plain` (Economy of attention): On a login form, where the password already exists and any judgement of it would be noise.
- `strength` (Immediate feedback): On a sign-up form with no fixed rules, where a four-step meter and one word say how far along it is.
- `checklist` (Recognition over recall): When your policy has hard rules, so people see each one tick off and never get rejected by surprise.
- `inline` (Law of proximity): In a tight settings row or a dialog, where a line on the field edge gives the verdict without adding height.

## Effects

Pass one as the `effect` prop.

- `spring` (Continuity): When the meter is prominent: it eases to the new level as they type, so a rising score reads as progress and not as flicker.

## Usage

```tsx
import { PasswordInput } from "@/components/ui/password-input"

<PasswordInput name="password" aria-label="Password" />

<PasswordInput variant="strength" effect="spring" requiredLength={12} />
<PasswordInput variant="checklist" labels={{ show: "비밀번호 표시" }} />
```

Exports: `PasswordInput`, `scorePassword`, `passwordChecks`
