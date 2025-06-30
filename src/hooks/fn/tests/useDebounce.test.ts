import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useDebounce } from '../index'

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("should create a debounced function", () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    expect(typeof debouncedFn).toBe('function')
    expect(fn).not.toHaveBeenCalled()
  })

  it("should delay function execution", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn()
    expect(fn).not.toHaveBeenCalled()
    
    // 推进时间到 50ms
    vi.setSystemTime(startTime + 50)
    await vi.waitFor(() => {}, { timeout: 10 })
    expect(fn).not.toHaveBeenCalled()
    
    // 推进时间到 100ms
    vi.setSystemTime(startTime + 100)
    await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(1))
  })

  it("should cancel previous calls when called multiple times", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn()
    vi.setSystemTime(startTime + 50)
    await vi.waitFor(() => {}, { timeout: 10 })
    
    debouncedFn() // 这应该取消前一个调用
    vi.setSystemTime(startTime + 100)
    await vi.waitFor(() => {}, { timeout: 10 })
    expect(fn).not.toHaveBeenCalled()
    
    vi.setSystemTime(startTime + 200)
    await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(1))
  })

  it("should pass arguments to the debounced function", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn('arg1', 'arg2', 123)
    vi.setSystemTime(startTime + 100)
    
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 123))
  })

  it("should use the latest arguments when called multiple times", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn('first')
    vi.setSystemTime(startTime + 50)
    await vi.waitFor(() => {}, { timeout: 10 })
    
    debouncedFn('second')
    vi.setSystemTime(startTime + 100)
    await vi.waitFor(() => {}, { timeout: 10 })
    
    debouncedFn('third')
    vi.setSystemTime(startTime + 200)
    
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith('third')
    })
  })

  it("should handle zero delay", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 0)
    
    debouncedFn()
    await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(1))
  })

  it("should handle multiple independent debounced functions", async () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const debouncedFn1 = useDebounce(fn1, 100)
    const debouncedFn2 = useDebounce(fn2, 200)
    
    const startTime = Date.now()
    debouncedFn1('fn1')
    debouncedFn2('fn2')
    
    vi.setSystemTime(startTime + 100)
    await vi.waitFor(() => expect(fn1).toHaveBeenCalledWith('fn1'))
    expect(fn2).not.toHaveBeenCalled()
    
    vi.setSystemTime(startTime + 200)
    await vi.waitFor(() => expect(fn2).toHaveBeenCalledWith('fn2'))
  })

  it("should work with functions that return values", async () => {
    const fn = vi.fn().mockReturnValue('result')
    const debouncedFn = useDebounce(fn, 100)
    
    // 注意：防抖函数不返回原函数的返回值
    const result = debouncedFn()
    expect(result).toBeUndefined()
    
    const startTime = Date.now()
    vi.setSystemTime(startTime + 100)
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalled()
      expect(fn).toHaveReturnedWith('result')
    })
  })

  it("should handle complex argument types", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const obj = { key: 'value' }
    const arr = [1, 2, 3]
    const func = () => 'test'
    
    const startTime = Date.now()
    debouncedFn(obj, arr, func)
    vi.setSystemTime(startTime + 100)
    
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith(obj, arr, func))
  })

  it("should handle rapid successive calls correctly", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    // 快速连续调用
    for (let i = 0; i < 10; i++) {
      debouncedFn(i)
      vi.setSystemTime(startTime + (i + 1) * 10)
      await vi.waitFor(() => {}, { timeout: 5 })
    }
    
    // 此时还没有执行
    expect(fn).not.toHaveBeenCalled()
    
    // 等待剩余时间
    vi.setSystemTime(startTime + 200)
    
    // 只应该执行一次，使用最后的参数
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(9)
    })
  })

  it("should work with async functions", async () => {
    const asyncFn = vi.fn().mockResolvedValue('async result')
    const debouncedFn = useDebounce(asyncFn, 100)
    
    const startTime = Date.now()
    debouncedFn('test')
    vi.setSystemTime(startTime + 100)
    
    await vi.waitFor(() => expect(asyncFn).toHaveBeenCalledWith('test'))
  })

  it("should handle edge case with very small delays", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 1)
    
    const startTime = Date.now()
    debouncedFn()
    vi.setSystemTime(startTime + 1)
    
    await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(1))
  })

  it("should handle multiple calls with different delays", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn('first')
    vi.setSystemTime(startTime + 80)
    await vi.waitFor(() => {}, { timeout: 10 })
    
    debouncedFn('second')
    vi.setSystemTime(startTime + 160)
    await vi.waitFor(() => {}, { timeout: 10 })
    
    debouncedFn('third')
    vi.setSystemTime(startTime + 260)
    
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledTimes(2)
      expect(fn).toHaveBeenNthCalledWith(1, 'first')
      expect(fn).toHaveBeenNthCalledWith(2, 'third')
    })
  })

  it("should work correctly after long periods of inactivity", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn('first')
    vi.setSystemTime(startTime + 100)
    await vi.waitFor(() => expect(fn).toHaveBeenCalledWith('first'))
    
    // 长时间等待
    vi.setSystemTime(startTime + 10100)
    
    debouncedFn('second')
    vi.setSystemTime(startTime + 10200)
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledWith('second')
      expect(fn).toHaveBeenCalledTimes(2)
    })
  })

  it("should handle functions with no arguments", async () => {
    const fn = vi.fn()
    const debouncedFn = useDebounce(fn, 100)
    
    const startTime = Date.now()
    debouncedFn()
    vi.setSystemTime(startTime + 100)
    
    await vi.waitFor(() => {
      expect(fn).toHaveBeenCalledWith()
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})