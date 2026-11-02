import { SPRING_DEFAULT, SPRING_MOMENTUM, clampUnit, projectMomentum, rubberband } from "./motion"

describe("spring presets", () => {
  it("default spring has no bounce; momentum spring has some", () => {
    expect(SPRING_DEFAULT).toMatchObject({ type: "spring", bounce: 0 })
    expect(SPRING_MOMENTUM.bounce).toBeGreaterThan(0)
  })
})

describe("projectMomentum", () => {
  it("projects further for faster flicks and keeps the sign", () => {
    expect(projectMomentum(0)).toBe(0)
    expect(projectMomentum(1000)).toBeGreaterThan(projectMomentum(500))
    expect(projectMomentum(-1000)).toBeLessThan(0)
  })

  it("matches Apple's decay formula for a 1000 px/s flick at 0.998", () => {
    expect(projectMomentum(1000)).toBeCloseTo(499, 0)
  })
})

describe("rubberband", () => {
  it("never exceeds the overshoot and grows ever more slowly", () => {
    const small = rubberband(50, 400)
    const large = rubberband(400, 400)
    expect(small).toBeLessThan(50)
    expect(large).toBeLessThan(400)
    expect(large - small).toBeLessThan(350 - 0)
    expect(rubberband(-50, 400)).toBeLessThan(0)
  })
})

describe("clampUnit", () => {
  it("clamps to 0..1 and treats NaN as 0", () => {
    expect(clampUnit(-1)).toBe(0)
    expect(clampUnit(2)).toBe(1)
    expect(clampUnit(0.4)).toBe(0.4)
    expect(clampUnit(Number.NaN)).toBe(0)
  })
})
