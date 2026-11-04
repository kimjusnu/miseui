# Signup Steps

A sign-up that asks one question at a time, starts with real progress and never ticks consent for anyone, in a card, beside a rail of what is left, or as one large question per screen.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/signup-steps.json
```

## Why it looks like this

**Goal-gradient effect.** People push harder the closer a goal looks, and they are more likely to finish a task that has visibly begun. The bar opens with the first step already credited, then moves on a spring with each answer, so effort is rewarded at once. One question per screen keeps the next step small enough that stopping feels sillier than continuing.

**Don't.** Credit only something the person has really done; a bar that lies about progress stops being believed. Never pre-tick consent or bundle marketing into the terms, because that is a dark pattern and in many places illegal. If you only need one or two fields, use a single form instead.

## Designs

Pass one as the `variant` prop.

- `card` (Goal-gradient effect): A short sign-up of two or three questions, placed on a page of its own or over your marketing page.
- `rail` (Zeigarnik effect): A longer setup people may worry about: the rail names what is left and lets them step back to an earlier answer, and it folds to a bar on phones.
- `conversation` (Cognitive load): Questions people have to think about, such as naming a team: nothing else on the screen, and the last answer read back.

## Usage

```tsx
import { SignupSteps } from "@/components/signup-steps"

<SignupSteps
  variant="card"
  steps={[
    { id: "start", label: "Started", credited: true },
    { id: "email", label: "Email", question: "What is your work email?", fieldLabel: "Work email", type: "email" },
    { id: "team", label: "Team", question: "What is your team called?", fieldLabel: "Team name", consent: "I agree to the terms." },
  ]}
  onComplete={async (values) => {
    await createAccount(values) // a rejection's message appears inline
  }}
/>

// A step's aside doubles as what the rail says about it while it is still ahead
<SignupSteps variant="rail" steps={steps} onComplete={createAccount} />
<SignupSteps variant="conversation" steps={steps} onComplete={createAccount} />
```

Exports: `SignupSteps`
