/**
 * Asked when an event arrives, never during render, so a server render hydrates and a laptop with a touch screen
 * answers for the input it is using right now.
 */
export function isFinePointer() {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches
}
