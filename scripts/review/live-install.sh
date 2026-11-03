#!/usr/bin/env bash
# Installs named components from the live registry into a clean project and type-checks the result.
# Usage: live-install.sh name1 name2 ...
set -u
LIVE="https://miseui.junsu4621.workers.dev"
DIR="$(cygpath -u "$TEMP")/miseui-live-$$"
mkdir -p "$DIR/src/lib"
cd "$DIR" || exit 2
cat > package.json <<'JSON'
{ "name": "live-check", "private": true, "type": "module", "version": "0.0.0" }
JSON
cat > tsconfig.json <<'JSON'
{ "compilerOptions": { "target": "ES2022", "lib": ["ES2022", "DOM", "DOM.Iterable"], "module": "ESNext", "moduleResolution": "bundler", "jsx": "react-jsx", "strict": true, "noEmit": true, "skipLibCheck": true, "paths": { "@/*": ["./src/*"] } }, "include": ["src"] }
JSON
cat > components.json <<'JSON'
{ "$schema": "https://ui.shadcn.com/schema.json", "style": "new-york", "rsc": false, "tsx": true, "tailwind": { "css": "src/index.css", "baseColor": "neutral", "cssVariables": true }, "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" } }
JSON
printf '@import "tailwindcss";\n' > src/index.css
cat > src/lib/utils.ts <<'TS'
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
TS
pnpm add -s react react-dom clsx tailwind-merge tailwindcss >/dev/null 2>&1
pnpm add -s -D typescript@6 @types/react @types/react-dom >/dev/null 2>&1
URLS=()
for name in "$@"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$LIVE/r/$name.json")
  echo "HTTP $code $name"
  URLS+=("$LIVE/r/$name.json")
done
pnpm dlx shadcn@latest add "${URLS[@]}" -y --overwrite 2>&1 | tail -6
echo "ADD_EXIT=${PIPESTATUS[0]}"
echo "installed ui files: $(ls src/components/ui 2>/dev/null | wc -l)"
grep -rl "registry/miseui" src | wc -l | sed 's/^/leftover registry imports: /'
pnpm exec tsc --noEmit 2>&1 | tail -15
echo "TSC_EXIT=${PIPESTATUS[0]}"
cd /
rm -rf "$DIR"
