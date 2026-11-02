export const SITE_URL: string = import.meta.env.VITE_SITE_URL ?? "https://miseui.pages.dev"
export const GITHUB_URL = "https://github.com/kimjusnu/miseui"

export const installCommand = (name: string) => `npx shadcn@latest add ${SITE_URL}/r/${name}.json`
