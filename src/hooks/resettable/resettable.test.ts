import { useResettableRef, useResettableReactive } from "."
import { describe, it, expect } from "vitest"

describe("useResettableRef", () => {
  it("should initialize with the correct value", () => {
    const initial = () => ({ foo: "bar" })
    const [state] = useResettableRef(initial)
    expect(state.value).toEqual(initial())
  })

  it("should reset to initial value after modification", () => {
    const initial = () => ({ count: 0 })
    const [state, reset] = useResettableRef(initial)
    state.value.count = 10
    reset()
    expect(state.value.count).toBe(0)
  })

  it("should deep clone objects", () => {
    const initial = () => ({ a: { b: 1 } })
    const [state, reset] = useResettableRef(initial)
    state.value.a.b = 2
    reset()
    expect(state.value.a.b).toBe(1)
    expect(initial().a.b).toBe(1)
  })
})

describe("useResettableReactive", () => {
  it("should initialize with the correct value", () => {
    const initial = () => ({ foo: "bar" })
    const [state] = useResettableReactive(initial)
    expect(state).toEqual(initial())
  })

  it("should reset to initial value after modification", () => {
    const initial = () => ({ count: 0 })
    const [state, reset] = useResettableReactive(initial)
    state.count = 10
    reset()
    expect(state.count).toBe(0)
  })

  it("should deep clone objects", () => {
    const initial = () => ({ a: { b: 1 } })
    const [state, reset] = useResettableReactive(initial)
    state.a.b = 2
    reset()
    expect(state.a.b).toBe(1)
    expect(initial().a.b).toBe(1)
  })
})
