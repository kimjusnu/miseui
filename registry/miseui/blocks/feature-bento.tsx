import { FeatureBentoGrid, type BentoFeature, type BentoSpan, type FeatureBentoSectionProps } from "./feature-bento-grid"
import { FeatureBentoRows } from "./feature-bento-rows"
import { FeatureBentoTabs } from "./feature-bento-tabs"

type FeatureBentoVariant = "bento" | "rows" | "tabs"

interface FeatureBentoProps extends FeatureBentoSectionProps {
  /** `bento` cells of mixed size, `rows` alternating picture and text, `tabs` a list driving one large panel. */
  variant?: FeatureBentoVariant
  /** The feature open first on `tabs`. Defaults to the first one. */
  defaultFeatureId?: string
}

function FeatureBento({ variant, defaultFeatureId, ...props }: FeatureBentoProps) {
  switch (variant) {
    case "rows":
      return <FeatureBentoRows {...props} />
    case "tabs":
      return <FeatureBentoTabs defaultFeatureId={defaultFeatureId} {...props} />
    default:
      return <FeatureBentoGrid {...props} />
  }
}

export { FeatureBento, type BentoFeature, type BentoSpan, type FeatureBentoProps, type FeatureBentoVariant }
