import { LoginForm, type LoginFormVariant } from "@/registry/miseui/blocks/login-form"

export function Demo({ variant }: { variant?: string }) {
  return <LoginForm variant={variant as LoginFormVariant} />
}
