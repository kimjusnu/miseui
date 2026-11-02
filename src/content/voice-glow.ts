import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "voice-glow",
  title: "Voice Glow",
  category: "effects",
  description:
    "A round glow that swells with the microphone level, so the user sees the assistant is listening and how loudly it hears them.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "People keep talking only while they can see they are being heard. A core that brightens and a halo that swells with the voice confirm it continuously, in the corner of the eye, without a word on screen. When the microphone is off the halo is gone and the core sits small and dim, so silence is never mistaken for listening.",
    avoid:
      "Do not leave it glowing after the recording ends, and never run it from a timer as decoration; a glow that pulses while the mic is dead teaches people to ignore it. Feed it the real analyser level.",
  },
  usage: `import { VoiceGlow } from "@/components/ui/voice-glow"

// \`level\` is 0..1 from your audio analyser
<VoiceGlow active level={level} />
<VoiceGlow active={false} size={80} />
<VoiceGlow active level={level} label="Recording a voice note" />`,
  exports: ["VoiceGlow"],
}
