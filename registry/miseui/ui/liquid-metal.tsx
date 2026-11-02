import type * as React from "react"
import { useEffect, useRef, useState } from "react"
import { useReducedMotion } from "motion/react"
import { clampUnit } from "@/registry/miseui/lib/motion"
import { cn } from "@/registry/miseui/lib/utils"

type LiquidMetalTint = "silver" | "mise"
type Rgb = readonly [number, number, number]

const DEFAULT_INTENSITY = 0.7
const DEFAULT_SPEED = 1
/** Retina is plenty for a soft reflection; above that the shader cost grows with nothing to show for it. */
const MAX_PIXEL_RATIO = 2
const MILLISECONDS_PER_SECOND = 1000
const CHANNEL_MAX = 255
const MISE_TOKEN = "--mise"
/** Slightly cool silver, and light-theme --mise for when the token cannot be resolved (no 2D canvas). */
const SILVER_RGB: Rgb = [0.86, 0.87, 0.9]
const MISE_FALLBACK_RGB: Rgb = [0.93, 0.6, 0.27]

/** One triangle covering clip space; no vertex buffer needed. */
const VERTEX_SHADER = `#version 300 es
void main() {
  gl_Position = vec4(vec2((gl_VertexID & 1) * 4 - 1, (gl_VertexID & 2) * 2 - 1), 0.0, 1.0);
}`

/**
 * Two octaves of value noise warp each other and drift, like a room sliding across a curved surface. The field
 * becomes cosine bands, bright and dark (environment streaks), over a sky-to-ground gradient, and the edges catch
 * extra light, a cheap stand-in for Fresnel on a bevel. Cosines and quintic noise matter: a triangle wave or
 * cubic fade leaves creases. The coordinates lean over and the warp stays small because a button is one noise
 * cell tall: stronger warp folds the field into hard vertical lines, while streaks that run along the surface read as chrome.
 */
const FRAGMENT_SHADER = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform vec3 u_tint;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float valueNoise(vec2 p) {
  vec2 cell = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(cell), b = hash(cell + vec2(1.0, 0.0));
  float c = hash(cell + vec2(0.0, 1.0)), d = hash(cell + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  return valueNoise(p) * 0.7 + valueNoise(p * 2.0 + 7.3) * 0.3;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = u_time;
  vec2 q = vec2(p.x * 0.45 + p.y * 0.3, p.y * 1.25 - p.x * 0.1);
  float warp = fbm(q * 0.9 + vec2(t * 0.1, -t * 0.07));
  float field = fbm(q * 1.2 + vec2(warp * 0.55 - t * 0.14, warp * 0.3 + t * 0.08));
  float band = pow(0.5 + 0.5 * cos(6.2832 * (field * 1.5 + t * 0.03)), 2.5);
  float dark = pow(0.5 + 0.5 * cos(6.2832 * (field * 0.9 - t * 0.02) + 1.7), 2.0);
  float sky = 0.74 + 0.3 * uv.y;
  float edge = min(min(uv.x, 1.0 - uv.x) * aspect, min(uv.y, 1.0 - uv.y));
  float fresnel = pow(1.0 - smoothstep(0.0, 0.5, edge), 2.0);
  float shade = sky * (0.76 + 0.1 * field) - u_intensity * 0.16 * dark + u_intensity * (0.36 * band + 0.2 * fresnel);
  fragColor = vec4(u_tint * shade + vec3(0.24) * u_intensity * band, 1.0);
}`

interface LiquidMetalProps extends React.ComponentProps<"div"> {
  /** The control to dress: a button, chip or icon with a transparent background. */
  children: React.ReactNode
  /** 0..1, how strong the moving highlights are. Values outside the range are clamped. */
  intensity?: number
  /** Flow speed multiplier; 1 is a slow, calm drift. */
  speed?: number
  /** "silver" is neutral metal; "mise" reads the --mise token so the metal takes the accent colour. */
  tint?: LiquidMetalTint
}

type MetalOptions = Required<Pick<LiquidMetalProps, "intensity" | "speed" | "tint">> & { enabled: boolean; reduceMotion: boolean }

let webgl2Probe: boolean | undefined
/** Probed once per page: WebGL2 availability does not change between renders. */
function supportsWebGL2() {
  if (webgl2Probe === undefined) {
    const probe = typeof document === "undefined" ? null : document.createElement("canvas").getContext("webgl2")
    webgl2Probe = Boolean(probe)
    probe?.getExtension("WEBGL_lose_context")?.loseContext()
  }
  return webgl2Probe
}

/** Resolves any CSS colour (oklch included) to 0..1 RGB by painting it on a 1 px canvas. */
function resolveCssColor(value: string): Rgb | null {
  const ctx = document.createElement("canvas").getContext("2d")
  if (!ctx || !value) return null
  ctx.fillStyle = "transparent"
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b, alpha] = ctx.getImageData(0, 0, 1, 1).data
  return alpha === 0 ? null : [r / CHANNEL_MAX, g / CHANNEL_MAX, b / CHANNEL_MAX]
}

function tintRgb(host: HTMLElement, tint: LiquidMetalTint): Rgb {
  if (tint === "silver") return SILVER_RGB
  return resolveCssColor(getComputedStyle(host).getPropertyValue(MISE_TOKEN).trim()) ?? MISE_FALLBACK_RGB
}

function createProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram()
  if (!program) return null
  const stages = [[gl.VERTEX_SHADER, VERTEX_SHADER], [gl.FRAGMENT_SHADER, FRAGMENT_SHADER]] as const
  for (const [type, source] of stages) {
    const shader = gl.createShader(type)
    if (!shader) return null
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null
    gl.attachShader(program, shader)
  }
  gl.linkProgram(program)
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null
}

/** Owns the GL context: draws once, then loops only while the canvas is on screen and motion is allowed. */
function useMetalCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  hostRef: React.RefObject<HTMLDivElement | null>,
  { enabled, intensity, speed, tint, reduceMotion }: MetalOptions,
) {
  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!enabled || !canvas || !host) return
    const gl = canvas.getContext("webgl2", { antialias: false, premultipliedAlpha: true })
    const program = gl ? createProgram(gl) : null
    if (!gl || !program) return
    gl.useProgram(program)
    gl.uniform1f(gl.getUniformLocation(program, "u_intensity"), intensity)
    gl.uniform3fv(gl.getUniformLocation(program, "u_tint"), tintRgb(host, tint))
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")
    const timeLocation = gl.getUniformLocation(program, "u_time")
    const draw = (seconds: number) => {
      gl.uniform1f(timeLocation, seconds * speed)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    const fit = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.round(width * ratio))
      canvas.height = Math.max(1, Math.round(height * ratio))
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
    }
    let frame = 0
    const start = performance.now()
    const loop = (now: number) => {
      draw((now - start) / MILLISECONDS_PER_SECOND)
      frame = requestAnimationFrame(loop)
    }
    const play = () => {
      if (frame === 0 && !reduceMotion) frame = requestAnimationFrame(loop)
    }
    const pause = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    fit()
    draw(0)
    const sizer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => fit())
    sizer?.observe(canvas)
    const watcher =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(([entry]) => (entry?.isIntersecting ? play() : pause()))
    if (watcher) watcher.observe(canvas)
    else play()
    return () => {
      pause()
      sizer?.disconnect()
      watcher?.disconnect()
      gl.deleteProgram(program)
    }
  }, [canvasRef, hostRef, enabled, intensity, speed, tint, reduceMotion])
}

function LiquidMetal({
  children,
  intensity = DEFAULT_INTENSITY,
  speed = DEFAULT_SPEED,
  tint = "silver",
  className,
  ...props
}: LiquidMetalProps) {
  const reduceMotion = useReducedMotion() ?? false
  const [supported] = useState(supportsWebGL2)
  const hostRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const level = clampUnit(intensity)
  useMetalCanvas(canvasRef, hostRef, { enabled: supported, intensity: level, speed, tint, reduceMotion })
  return (
    <div
      ref={hostRef}
      data-slot="liquid-metal"
      data-tint={tint}
      data-intensity={level}
      data-fallback={supported ? undefined : "true"}
      data-reduced={reduceMotion ? "true" : "false"}
      className={cn("relative isolate inline-flex", className)}
      {...props}
    >
      {supported ? (
        <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 size-full rounded-[inherit]" />
      ) : null}
      {children}
    </div>
  )
}

export { LiquidMetal, type LiquidMetalProps, type LiquidMetalTint }
