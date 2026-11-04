import { SignupSteps, type SignupStepsVariant } from "@/registry/miseui/blocks/signup-steps"

export function Demo({ variant }: { variant?: string }) {
  return <SignupSteps variant={variant as SignupStepsVariant} />
}
