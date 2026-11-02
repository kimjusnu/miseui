# Agent Avatar

A deterministic SVG face for an agent: the same seed always draws the same overlapping blobs, in theme colours.

## Install

```bash
npx shadcn@latest add https://miseui.junsu4621.workers.dev/r/agent-avatar.json
```

## Why it looks like this

**Familiarity · identity.** In a thread with several agents, people need to know who said what before they read it. A face that is always the same for the same agent does that in a glance, and seeing it again builds trust the way a familiar byline does. The shapes are abstract blobs in the theme's own colours, so they sit beside real people's photos without pretending to be one.

**Don't.** Do not make it look like a human photo, and never derive the seed from anything that changes between renders (a timestamp, a message id); a face that keeps changing is worse than no face.

## Usage

```tsx
import { AgentAvatar } from "@/components/ui/agent-avatar"

<AgentAvatar seed={agent.id} />
<AgentAvatar seed="researcher" size={56} label="Research agent" />
```

Exports: `AgentAvatar`
