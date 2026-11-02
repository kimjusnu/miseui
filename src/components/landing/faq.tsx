import { GITHUB_URL } from "@/src/lib/site"

const FAQ = [
  {
    q: "Is it free?",
    a: "Yes. Everything is MIT licensed and installs as source into your project. There is nothing to subscribe to and nothing to uninstall later.",
  },
  {
    q: "Does it work with my shadcn project?",
    a: "That is the whole idea. Mise UI is a shadcn registry, so the add command drops a component next to your existing ones, using your aliases and your Tailwind v4 setup.",
  },
  {
    q: "What does “explains itself” mean?",
    a: "Each component names the psychological principle behind its shape (Doherty threshold, visibility of system status, selective attention…) and the situation where you should not use it. The docs, the agent skill and llms.txt are generated from the same metadata.",
  },
  {
    q: "Why so much about motion?",
    a: "Because AI interfaces are mostly waiting and hand-offs. Springs with no overshoot, feedback on press, materials with depth and reduced-motion fallbacks are what make a wait feel alive instead of frozen. The rules come from Apple's fluid-interface design talks, translated to the web.",
  },
  {
    q: "Can I use the effects without the rest?",
    a: "Yes. Every effect is its own registry item with its own dependencies. A core component with effects installs the effect files it uses as source, so you can delete the ones you never pass.",
  },
] as const

export function Faq() {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto w-full max-w-6xl px-4 py-24 md:px-6">
      <h2 id="faq-heading" className="text-display text-4xl md:text-5xl">
        Questions.
      </h2>
      <div className="mt-10 divide-y">
        {FAQ.map((item) => (
          <details key={item.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[17px] font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="text-muted-foreground transition-transform duration-(--duration-fast) ease-(--ease-mise) group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-pretty text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Something else?{" "}
        <a className="underline underline-offset-4" href={`${GITHUB_URL}/issues`}>
          Open an issue
        </a>
        .
      </p>
    </section>
  )
}
