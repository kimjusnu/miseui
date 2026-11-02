import { useEffect, useReducer } from "react"
import { useReducedMotion } from "motion/react"
import type { ReasoningStep, ReasoningStepStatus } from "@/registry/miseui/ui/reasoning-steps"
import type { ToolCallStatus } from "@/registry/miseui/ui/tool-call-card"
import type { ChatMessage, ChatStatus, ChatToolCall } from "@/registry/miseui/blocks/chat-assistant-parts"

/**
 * A scripted conversation, used only when no `messages` are passed, so the block shows every state out
 * of the box. Once your model is wired up, delete this file together with SampleChat in chat-assistant.tsx.
 * Text arrives word by word, as a real stream does.
 */
const FRAME_MS = 700
/** About 55 characters a second, a little under StreamingText's reveal, so the caret never stalls. */
const WORD_MS = 110

const STEP_LABELS = ["Reading your question", "Searching the reports", "Writing the answer"] as const

function stepsAt(statuses: readonly ReasoningStepStatus[]): readonly ReasoningStep[] {
  return STEP_LABELS.map((label, index) => ({ id: `step-${index}`, label, status: statuses[index] }))
}

function toolAt(status: ToolCallStatus): readonly ChatToolCall[] {
  return [
    {
      id: "search",
      name: "search_reports",
      status,
      input: { period: "last_90_days" },
      output: status === "success" ? { reports: 4 } : undefined,
      durationMs: status === "success" ? 840 : undefined,
    },
  ]
}

const FRAMES: readonly Pick<ChatMessage, "reasoning" | "tools">[] = [
  { reasoning: stepsAt(["active", "pending", "pending"]), tools: [] },
  { reasoning: stepsAt(["done", "active", "pending"]), tools: toolAt("running") },
  { reasoning: stepsAt(["done", "done", "active"]), tools: toolAt("success") },
  { reasoning: stepsAt(["done", "done", "done"]), tools: toolAt("success") },
]
const LAST_FRAME = FRAMES.length - 1

const SAMPLE_HISTORY: readonly ChatMessage[] = [
  { id: "m1", role: "user", text: "Why did churn jump in March?" },
  {
    id: "m2",
    role: "assistant",
    text: "41 accounts left in March, up from 18 in February. 29 of them were annual Starter renewals that came due after the price change, and most of those never added a second seat. Monthly plans held steady, so this looks like a renewal problem, not a product one.",
    reasoning: [
      { id: "r1", label: "Read the March churn export", status: "done" },
      { id: "r2", label: "Compared cohorts against February", status: "done", detail: "Starter annual stands out" },
      { id: "r3", label: "Checked billing events", status: "done" },
    ],
    tools: [
      {
        id: "t1",
        name: "query_accounts",
        status: "success",
        input: { churned_in: "2026-03", group_by: "plan" },
        output: { starter_annual: 29, starter_monthly: 7, team: 5 },
        durationMs: 1240,
      },
    ],
  },
  { id: "m3", role: "user", text: "Which of those are worth a call this week?" },
]

const OPENING_REPLY =
  "Start with Northgate Studio and Halden Freight. Both renewed for two years before this one, both went quiet after the price change, and each still has an open invoice question. I can draft the two emails if you want."
const PREVIEW_REPLY =
  "This is a preview reply, so nothing was really read. Pass messages and status to connect your own model, and this turn will show its steps as they happen."

function toWords(text: string) {
  return text.split(" ")
}

interface SampleState {
  messages: readonly ChatMessage[]
  status: ChatStatus
  frame: number
  words: number
  script: readonly string[]
  nextId: number
}

type SampleAction = { type: "send"; text: string; instant: boolean } | { type: "tick" } | { type: "stop" } | { type: "reset" }

function initialState(instant: boolean): SampleState {
  const script = toWords(OPENING_REPLY)
  const reply: ChatMessage = { id: "m4", role: "assistant", text: instant ? OPENING_REPLY : "" }
  return {
    messages: [...SAMPLE_HISTORY, reply],
    status: instant ? "idle" : "generating",
    frame: LAST_FRAME,
    words: instant ? script.length : 0,
    script,
    nextId: 5,
  }
}

function patchLast(messages: readonly ChatMessage[], patch: Partial<ChatMessage>) {
  return messages.map((message, index) => (index === messages.length - 1 ? { ...message, ...patch } : message))
}

function sendMessage(state: SampleState, text: string, instant: boolean): SampleState {
  const user: ChatMessage = { id: `m${state.nextId}`, role: "user", text }
  const id = `m${state.nextId + 1}`
  const script = toWords(PREVIEW_REPLY)
  const reply: ChatMessage = instant
    ? { id, role: "assistant", text: PREVIEW_REPLY, ...FRAMES[LAST_FRAME] }
    : { id, role: "assistant", text: "", ...FRAMES[0] }
  return {
    messages: [...state.messages, user, reply],
    status: instant ? "idle" : "generating",
    frame: instant ? LAST_FRAME : 0,
    words: instant ? script.length : 0,
    script,
    nextId: state.nextId + 2,
  }
}

function advance(state: SampleState): SampleState {
  if (state.frame < LAST_FRAME) {
    const frame = state.frame + 1
    return { ...state, frame, messages: patchLast(state.messages, FRAMES[frame]) }
  }
  const words = state.words + 1
  return {
    ...state,
    words,
    status: words >= state.script.length ? "idle" : "generating",
    messages: patchLast(state.messages, { text: state.script.slice(0, words).join(" ") }),
  }
}

/** A stopped turn must not keep breathing: unfinished steps go back to waiting, a running tool reads as failed. */
function stopTurn(state: SampleState): SampleState {
  const last = state.messages[state.messages.length - 1]
  const reasoning = last.reasoning?.map((step) => (step.status === "active" ? { ...step, status: "pending" as const } : step))
  const tools = last.tools?.map((tool) => (tool.status === "running" ? { ...tool, status: "error" as const } : tool))
  return { ...state, status: "idle", messages: patchLast(state.messages, { reasoning, tools }) }
}

function reducer(state: SampleState, action: SampleAction): SampleState {
  if (action.type === "send") return sendMessage(state, action.text, action.instant)
  if (action.type === "tick") return advance(state)
  if (action.type === "stop") return stopTurn(state)
  return { ...state, messages: [], status: "idle" }
}

function useSampleChat() {
  const instant = Boolean(useReducedMotion())
  const [state, dispatch] = useReducer(reducer, instant, initialState)
  const { status, frame } = state

  useEffect(() => {
    if (status !== "generating") return
    const id = window.setInterval(() => dispatch({ type: "tick" }), frame < LAST_FRAME ? FRAME_MS : WORD_MS)
    return () => window.clearInterval(id)
  }, [status, frame])

  return {
    messages: state.messages,
    status,
    send: (text: string) => dispatch({ type: "send", text, instant }),
    stop: () => dispatch({ type: "stop" }),
    reset: () => dispatch({ type: "reset" }),
  }
}

export { useSampleChat }
