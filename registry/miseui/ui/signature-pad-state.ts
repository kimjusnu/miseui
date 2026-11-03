import type * as React from "react"
import { useRef, useState } from "react"
import { addPoint, signatureReducer, strokesToPath, toBoxPoint, type SignatureAction, type SignatureBox, type SignatureStroke } from "@/registry/miseui/ui/signature-pad-math"

interface SignatureValue {
  /** The stored strokes. Hand these back through `defaultStrokes` to edit later. */
  strokes: readonly SignatureStroke[]
  /** The SVG path of the drawing. Empty when typed. */
  path: string
  /** The typed name, when someone chose to type. */
  typed: string
  empty: boolean
}

function usePadDrawing(box: SignatureBox, disabled: boolean, dispatch: (action: SignatureAction) => void) {
  const svg = useRef<SVGSVGElement>(null)
  const inProgress = useRef<SignatureStroke | null>(null)
  const [drawing, setDrawing] = useState<SignatureStroke | null>(null)
  const pointFrom = (event: { clientX: number; clientY: number }) => {
    const rect = svg.current?.getBoundingClientRect()
    return rect ? toBoxPoint(event.clientX, event.clientY, rect, box) : { x: 0, y: 0 }
  }
  const finish = (keep: boolean) => {
    const stroke = inProgress.current
    inProgress.current = null
    setDrawing(null)
    if (keep && stroke) dispatch({ type: "add", stroke })
  }
  const surface = {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0 || !event.isPrimary) return
      // Capture keeps the stroke alive when the pen leaves the pad and comes back.
      event.currentTarget.setPointerCapture(event.pointerId)
      inProgress.current = [pointFrom(event)]
      setDrawing(inProgress.current)
    },
    onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
      if (!inProgress.current) return
      // A fast hand outruns the frame rate; these are the samples the browser merged in between.
      const native = event.nativeEvent
      const samples = native.getCoalescedEvents?.() ?? []
      const points = (samples.length > 0 ? samples : [native]).map(pointFrom)
      inProgress.current = points.reduce<SignatureStroke>((stroke, point) => addPoint(stroke, point), inProgress.current)
      setDrawing(inProgress.current)
    },
    onPointerUp: () => finish(true),
    onPointerCancel: () => finish(false),
  }
  return { svg, drawing, surface }
}

function useSignature(defaultStrokes: readonly SignatureStroke[] | undefined, onChange: ((value: SignatureValue) => void) | undefined) {
  const [history, setHistory] = useState(() => ({ strokes: defaultStrokes ?? [], past: [] as readonly (readonly SignatureStroke[])[] }))
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState("")
  /** The name counts only while typing is the chosen way to sign. */
  const name = typing ? typed.trim() : ""
  const report = (strokes: readonly SignatureStroke[], nextName: string) => {
    const trimmed = nextName.trim()
    onChange?.({ strokes, path: trimmed ? "" : strokesToPath(strokes), typed: trimmed, empty: trimmed === "" && strokes.length === 0 })
  }
  const dispatch = (action: SignatureAction) => {
    const next = signatureReducer(history, action)
    setHistory(next)
    report(next.strokes, name)
  }
  return {
    strokes: history.strokes,
    canUndo: history.past.length > 0,
    typing,
    typed,
    name,
    empty: history.strokes.length === 0 && name === "",
    dispatch,
    undo: () => dispatch({ type: "undo" }),
    clear: () => {
      if (!typing) {
        dispatch({ type: "clear" })
        return
      }
      setTyped("")
      report(history.strokes, "")
    },
    toggleMode: () => {
      setTyping(!typing)
      report(history.strokes, typing ? "" : typed)
    },
    typeName: (next: string) => {
      setTyped(next)
      report(history.strokes, next)
    },
  }
}

export { usePadDrawing, useSignature, type SignatureValue }
