import type { ComponentMeta } from "./types"

export const meta: ComponentMeta = {
  name: "voice-wave",
  title: "Voice Wave",
  category: "ai",
  description:
    "Bars that rise with the microphone level so the user can see they are being heard, and see when they are not.",
  why: {
    principle: "Visibility of system status",
    explanation:
      "People start talking only once they can see the microphone is live, and they stop as soon as it visibly is not. Bars that follow the input level give that confirmation continuously, without a word of text, and a flat row makes a muted mic impossible to miss.",
    avoid:
      "Do not animate the bars from a timer when you have no real level; a wave that dances while the mic is dead teaches people to distrust it. Feed it the actual analyser value.",
  },
  usage: `import { VoiceWave } from "@/components/ui/voice-wave"

// \`level\` is 0..1 from your audio analyser
<VoiceWave active level={level} />
<VoiceWave active={false} />
<VoiceWave active level={level} bars={7} label="Recording a voice note" />`,
  exports: ["VoiceWave"],
}
