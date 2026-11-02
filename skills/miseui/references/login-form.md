# Login Form

A split login screen with labels that stay visible, inline errors, a password you can reveal and a calm brand panel.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/login-form.json
```

## Why it looks like this

**Recognition over recall.** Logging in is a test of memory, so the layout removes everything that adds to the load. Labels stay above the fields instead of vanishing like placeholders, the password can be revealed instead of retyped blind, and the browser's password manager is told exactly which field is which. An error appears next to the field it concerns and keeps what was typed.

**Don't.** Do not use the panel for a quote or a customer logo you cannot back up; one true sentence and a few pieces of your real product are enough, so replace the sample invoice through the visual prop. Do not disable paste on the password field. Say which field failed only if that does not tell an attacker which emails have accounts.

## Usage

```tsx
import { LoginForm } from "@/components/login-form"

<LoginForm
  className="min-h-dvh"
  brandName="Paperline"
  tagline="Invoices that chase themselves, so you do not have to."
  onSubmit={async ({ email, password }) => {
    await signIn(email, password) // a rejection's message appears inline
  }}
  onSocial={(id) => signInWith(id)}
/>
```

Exports: `LoginForm`
