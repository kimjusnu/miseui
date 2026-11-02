import { render, screen } from "@testing-library/react"
import { VoiceWave } from "./voice-wave"

describe("VoiceWave", () => {
  it("renders five bars by default and as many as asked for", () => {
    const { rerender } = render(<VoiceWave />)
    expect(screen.getAllByTestId("voice-bar")).toHaveLength(5)
    rerender(<VoiceWave bars={9} />)
    expect(screen.getAllByTestId("voice-bar")).toHaveLength(9)
  })

  it("tells assistive tech whether the microphone is listening", () => {
    const { rerender } = render(<VoiceWave active />)
    expect(screen.getByRole("img", { name: "Listening" })).toHaveAttribute("data-active", "true")
    rerender(<VoiceWave active={false} />)
    expect(screen.getByRole("img", { name: "Microphone off" })).toHaveAttribute("data-active", "false")
  })

  it("prefers an explicit label over the generated one", () => {
    render(<VoiceWave active label="Recording a voice note" />)
    expect(screen.getByRole("img", { name: "Recording a voice note" })).toBeInTheDocument()
  })

  it("clamps the level to 0..1 instead of failing on out-of-range values", () => {
    const { rerender } = render(<VoiceWave active level={-1} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-level", "0")
    rerender(<VoiceWave active level={2} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-level", "1")
    rerender(<VoiceWave active level={0.5} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-level", "0.5")
  })
})
