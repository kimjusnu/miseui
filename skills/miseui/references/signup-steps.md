# Signup Steps

A sign-up that asks one question at a time, starts with real progress on the bar and never ticks consent for anyone.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/signup-steps.json
```

## Why it looks like this

**Goal-gradient effect.** People push harder the closer a goal looks, and they are more likely to finish a task that has visibly begun. The bar opens with the first step already credited, then moves on a spring with each answer, so effort is rewarded at once. One question per screen keeps the next step small enough that stopping feels sillier than continuing.

**Don't.** Credit only something the person has really done; a bar that lies about progress stops being believed. Never pre-tick consent or bundle marketing into the terms, because that is a dark pattern and in many places illegal. If you only need one or two fields, use a single form instead.

## Usage

```tsx
import { SignupSteps } from "@/components/signup-steps"

<SignupSteps
  steps={[
    { id: "start", label: "Started", credited: true },
    { id: "email", label: "Email", question: "What is your work email?", fieldLabel: "Work email", type: "email" },
    { id: "team", label: "Team", question: "What is your team called?", fieldLabel: "Team name", consent: "I agree to the terms." },
  ]}
  onComplete={async (values) => {
    await createAccount(values) // a rejection's message appears inline
  }}
/>
```

Exports: `SignupSteps`
