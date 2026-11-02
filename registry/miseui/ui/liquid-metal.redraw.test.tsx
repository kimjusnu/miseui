import { render, waitFor } from "@testing-library/react"

/** Separate file: LiquidMetal caches WebGL2 support per module, and the main test file runs without WebGL. */
const drawArrays = vi.fn()
const uniform3fv = vi.fn()
const fakeGl = {
  VERTEX_SHADER: 1,
  FRAGMENT_SHADER: 2,
  COMPILE_STATUS: 3,
  LINK_STATUS: 4,
  TRIANGLES: 5,
  createProgram: () => ({}),
  createShader: () => ({}),
  shaderSource: () => undefined,
  compileShader: () => undefined,
  getShaderParameter: () => true,
  attachShader: () => undefined,
  linkProgram: () => undefined,
  getProgramParameter: () => true,
  useProgram: () => undefined,
  getUniformLocation: () => ({}),
  uniform1f: () => undefined,
  uniform2f: () => undefined,
  uniform3fv,
  viewport: () => undefined,
  deleteProgram: () => undefined,
  getExtension: () => null,
  drawArrays,
}

let notifyResize: () => void = () => undefined

class ResizeObserverStub {
  constructor(callback: () => void) {
    notifyResize = callback
  }
  observe() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => fakeGl as unknown as RenderingContext)
})

afterAll(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("LiquidMetal under reduced motion", () => {
  it("reads the token again when the palette changes, and repaints", async () => {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const { LiquidMetal } = await import("./liquid-metal")

    render(
      <LiquidMetal tint="mise">
        <span>Go</span>
      </LiquidMetal>,
    )
    const tintsAfterMount = uniform3fv.mock.calls.length
    const drawsAfterMount = drawArrays.mock.calls.length

    document.documentElement.dataset.palette = "cobalt"
    await waitFor(() => expect(uniform3fv.mock.calls.length).toBe(tintsAfterMount + 1))
    expect(drawArrays.mock.calls.length).toBe(drawsAfterMount + 1)
    delete document.documentElement.dataset.palette
  })

  it("draws again after a resize, because resizing a canvas clears it and no animation loop will repaint it", async () => {
    vi.resetModules()
    vi.doMock("motion/react", async (importOriginal) => ({
      ...(await importOriginal<typeof import("motion/react")>()),
      useReducedMotion: () => true,
    }))
    const { LiquidMetal } = await import("./liquid-metal")

    render(
      <LiquidMetal>
        <span>Go</span>
      </LiquidMetal>,
    )
    const drawsAfterMount = drawArrays.mock.calls.length
    expect(drawsAfterMount).toBeGreaterThan(0)

    notifyResize()
    expect(drawArrays.mock.calls.length).toBe(drawsAfterMount + 1)
  })
})
