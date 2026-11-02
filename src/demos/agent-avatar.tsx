import { useState } from "react"
import { AgentAvatar } from "@/registry/miseui/ui/agent-avatar"
import { Input } from "@/registry/miseui/ui/input"

const SEEDS = ["planner", "researcher", "writer", "reviewer", "critic"] as const
const INITIAL_SEED = "my-agent"

export function Demo() {
  const [seed, setSeed] = useState(INITIAL_SEED)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {SEEDS.map((name) => (
          <AgentAvatar key={name} seed={name} size={48} />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <AgentAvatar seed={seed} size={56} />
        <Input
          value={seed}
          onChange={(event) => setSeed(event.target.value)}
          aria-label="Agent seed"
          placeholder="Type a seed"
          className="max-w-56"
        />
      </div>
    </div>
  )
}
