import { describe, it, expect } from "vitest"
import { useResettableRef } from '../index'

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



  it("should work with arrays", () => {
    const initial = () => [1, 2, 3]
    const [state, reset] = useResettableRef(initial)
    state.value.push(4)
    expect(state.value).toEqual([1, 2, 3, 4])
    reset()
    expect(state.value).toEqual([1, 2, 3])
  })

  it("should handle nested objects correctly", () => {
    const initial = () => ({
      user: {
        name: "John",
        settings: {
          theme: "dark",
          notifications: true
        }
      }
    })
    const [state, reset] = useResettableRef(initial)
    
    state.value.user.name = "Jane"
    state.value.user.settings.theme = "light"
    
    reset()
    
    expect(state.value.user.name).toBe("John")
    expect(state.value.user.settings.theme).toBe("dark")
  })

  it("should create independent instances", () => {
    const initial = () => ({ count: 0 })
    const [state1] = useResettableRef(initial)
    const [state2] = useResettableRef(initial)
    
    state1.value.count = 10
    state2.value.count = 20
    
    expect(state1.value.count).toBe(10)
    expect(state2.value.count).toBe(20)
  })
})