import { describe, it, expect } from "vitest"
import { useResettableReactive } from '../index'

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

  it("should maintain reactivity after reset", () => {
    const initial = () => ({ count: 0, name: "test" })
    const [state, reset] = useResettableReactive(initial)
    
    // 修改状态
    state.count = 5
    state.name = "modified"
    
    // 重置
    reset()
    
    // 验证重置后的值
    expect(state.count).toBe(0)
    expect(state.name).toBe("test")
    
    // 验证重置后仍然是响应式的
    state.count = 10
    expect(state.count).toBe(10)
  })

  it("should work with arrays", () => {
    const initial = () => ({ items: [1, 2, 3] })
    const [state, reset] = useResettableReactive(initial)
    
    state.items.push(4)
    expect(state.items).toEqual([1, 2, 3, 4])
    
    reset()
    expect(state.items).toEqual([1, 2, 3])
  })

  it("should handle nested reactive objects", () => {
    const initial = () => ({
      user: {
        profile: {
          name: "John",
          age: 30
        },
        preferences: {
          theme: "dark",
          language: "en"
        }
      }
    })
    const [state, reset] = useResettableReactive(initial)
    
    // 修改嵌套属性
    state.user.profile.name = "Jane"
    state.user.profile.age = 25
    state.user.preferences.theme = "light"
    
    expect(state.user.profile.name).toBe("Jane")
    expect(state.user.profile.age).toBe(25)
    expect(state.user.preferences.theme).toBe("light")
    
    // 重置
    reset()
    
    expect(state.user.profile.name).toBe("John")
    expect(state.user.profile.age).toBe(30)
    expect(state.user.preferences.theme).toBe("dark")
  })

  it("should create independent instances", () => {
    const initial = () => ({ value: 0 })
    const [state1] = useResettableReactive(initial)
    const [state2] = useResettableReactive(initial)
    
    state1.value = 10
    state2.value = 20
    
    expect(state1.value).toBe(10)
    expect(state2.value).toBe(20)
  })

  it("should handle complex data structures", () => {
    const initial = () => ({
      users: [
        { id: 1, name: "Alice", active: true },
        { id: 2, name: "Bob", active: false }
      ],
      settings: {
        notifications: {
          email: true,
          push: false
        }
      }
    })
    const [state, reset] = useResettableReactive(initial)
    
    // 修改复杂数据结构
    state.users[0].name = "Alice Smith"
    state.users[1].active = true
    state.settings.notifications.push = true
    
    expect(state.users[0].name).toBe("Alice Smith")
    expect(state.users[1].active).toBe(true)
    expect(state.settings.notifications.push).toBe(true)
    
    // 重置
    reset()
    
    expect(state.users[0].name).toBe("Alice")
    expect(state.users[1].active).toBe(false)
    expect(state.settings.notifications.push).toBe(false)
  })
})