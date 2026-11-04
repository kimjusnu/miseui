import { motion, useReducedMotion } from "motion/react"
import { SPRING_DEFAULT } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/registry/miseui/ui/tabs"
import { SectionTitle, type BentoFeature, type FeatureBentoSectionProps } from "./feature-bento-grid"
import { PanelPlate, TAB_FEATURES } from "./feature-bento-panels"

const PANEL_START = { opacity: 0, y: 8 }
const PANEL_END = { opacity: 1, y: 0 }

function FeatureTab({ feature }: { feature: BentoFeature }) {
  return (
    <TabsTrigger
      value={feature.id}
      className="group h-auto min-h-10 w-full flex-none flex-col items-start gap-1 rounded-xl p-4 text-start whitespace-normal data-[state=active]:bg-muted data-[state=active]:shadow-none dark:data-[state=active]:bg-card"
    >
      <span className="text-[15px] leading-snug font-medium">{feature.title}</span>
      {/* Only the open one says more: the list stays short enough to read as a choice. */}
      <span className="hidden text-[13px] leading-relaxed font-normal text-pretty text-muted-foreground group-data-[state=active]:block">{feature.description}</span>
    </TabsTrigger>
  )
}

/** Renders only when opened, which is what plays the entrance, and means a closed panel's effects are not running. */
function FeaturePanel({ feature }: { feature: BentoFeature }) {
  const reduceMotion = useReducedMotion()
  return (
    <TabsContent value={feature.id} className="w-full min-w-0 rounded-xl focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <motion.div
        className="flex w-full justify-center"
        initial={reduceMotion ? false : PANEL_START}
        animate={PANEL_END}
        transition={SPRING_DEFAULT}
      >
        {feature.visual ?? <p className="text-display max-w-md text-2xl leading-[1.12]! text-pretty">{feature.description}</p>}
      </motion.div>
    </TabsContent>
  )
}

function FeatureBentoTabs({
  title = "After you hang up.",
  titleQuiet = "The notes take care of themselves.",
  features = TAB_FEATURES,
  defaultFeatureId,
  className,
  ...props
}: FeatureBentoSectionProps & { defaultFeatureId?: string }) {
  return (
    <section data-slot="feature-bento" data-variant="tabs" className={cn("@container w-full bg-background pointer-coarse:[&_input]:h-10", className)} {...props}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 @2xl:gap-12 @2xl:px-8">
        <SectionTitle title={title} quiet={titleQuiet} />
        {features.length > 0 ? (
          <Tabs
            defaultValue={defaultFeatureId ?? features[0].id}
            orientation="vertical"
            className="grid grid-cols-[minmax(0,1fr)] gap-4 @3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-8"
          >
            <TabsList aria-label="Features" className="h-auto w-full flex-col items-stretch gap-1 rounded-none bg-transparent p-0">
              {features.map((feature) => (
                <FeatureTab key={feature.id} feature={feature} />
              ))}
            </TabsList>
            {/* Above the list while stacked: the thumb is on the list, and the change has to happen where the eye can see it. */}
            <PanelPlate className="order-first min-h-80 @3xl:order-none @3xl:min-h-96">
              {features.map((feature) => (
                <FeaturePanel key={feature.id} feature={feature} />
              ))}
            </PanelPlate>
          </Tabs>
        ) : null}
      </div>
    </section>
  )
}

export { FeatureBentoTabs }
