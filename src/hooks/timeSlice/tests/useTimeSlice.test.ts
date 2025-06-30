import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useTimeSlice } from '../index'

describe("useTimeSlice", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("should initialize with correct default state", () => {
    const data = [1, 2, 3, 4, 5]
    const handler = vi.fn((item: number) => item * 2)
    
    const { isRunning } = useTimeSlice({
      data,
      handler
    })
    
    expect(isRunning.value).toBe(false)
  })

  it("should process data in chunks with default settings", async () => {
    const data = Array.from({ length: 25 }, (_, i) => i + 1) // 更多数据确保分时处理
    const handler = vi.fn((item: number) => item * 2)
    const onComplete = vi.fn()
    const onProgress = vi.fn()
    
    const { start, isRunning } = useTimeSlice({
      data,
      handler,
      onComplete,
      onProgress
    })
    
    start()
    expect(isRunning.value).toBe(true)
    
    // 推进时间，让所有任务完成
    await vi.runAllTimersAsync()
    
    expect(handler).toHaveBeenCalledTimes(25)
    expect(onComplete).toHaveBeenCalledWith(data.map(x => x * 2))
    expect(onProgress).toHaveBeenCalledTimes(3) // 25个数据分3个时间片：10+10+5
    expect(isRunning.value).toBe(false)
  })

  it("should process data with custom count and interval", async () => {
    const data = [1, 2, 3, 4, 5, 6]
    const handler = vi.fn((item: number) => item * 2)
    const onProgress = vi.fn()
    
    const { start } = useTimeSlice({
      data,
      handler,
      count: 2, // 每次处理2个
      interval: 100, // 间隔100ms
      onProgress
    })
    
    start()
    
    // 第一批处理
    await vi.advanceTimersByTimeAsync(0)
    expect(handler).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenCalledWith(2, 6)
    
    // 第二批处理
    await vi.advanceTimersByTimeAsync(100)
    expect(handler).toHaveBeenCalledTimes(4)
    expect(onProgress).toHaveBeenCalledWith(4, 6)
    
    // 第三批处理
    await vi.advanceTimersByTimeAsync(100)
    expect(handler).toHaveBeenCalledTimes(6)
    expect(onProgress).toHaveBeenCalledWith(6, 6)
  })

  it("should handle pause and resume correctly", async () => {
    const data = [1, 2, 3, 4, 5]
    const handler = vi.fn((item: number) => item * 2)
    
    const { start, pause, resume, isRunning } = useTimeSlice({
      data,
      handler,
      count: 1,
      interval: 100
    })
    
    start()
    expect(isRunning.value).toBe(true)
    
    // 处理第一个
    await vi.advanceTimersByTimeAsync(0)
    expect(handler).toHaveBeenCalledTimes(1)
    
    // 暂停
    pause()
    expect(isRunning.value).toBe(true) // 暂停时isRunning仍为true，只是暂停执行
    
    // 推进时间，不应该继续处理
    await vi.advanceTimersByTimeAsync(200)
    expect(handler).toHaveBeenCalledTimes(1)
    
    // 恢复
    resume()
    expect(isRunning.value).toBe(true)
    
    // 继续处理
    await vi.advanceTimersByTimeAsync(100)
    expect(handler).toHaveBeenCalledTimes(3) // 恢复后继续处理
    
    // 继续处理剩余数据
    await vi.runAllTimersAsync()
    expect(handler).toHaveBeenCalledTimes(5) // 处理完所有5个数据
  })

  it("should handle stop correctly", async () => {
    const data = [1, 2, 3, 4, 5]
    const handler = vi.fn((item: number) => item * 2)
    const onComplete = vi.fn()
    
    const { start, stop, isRunning } = useTimeSlice({
      data,
      handler,
      count: 1,
      interval: 100,
      onComplete
    })
    
    start()
    expect(isRunning.value).toBe(true)
    
    // 处理第一个
    await vi.advanceTimersByTimeAsync(0)
    expect(handler).toHaveBeenCalledTimes(1)
    
    // 停止
    stop()
    expect(isRunning.value).toBe(false)
    
    // 推进时间，不应该继续处理
    await vi.advanceTimersByTimeAsync(500)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(onComplete).not.toHaveBeenCalled()
  })

  it("should handle empty data array", async () => {
    const data: number[] = []
    const handler = vi.fn((item: number) => item * 2)
    const onComplete = vi.fn()
    
    const { start, isRunning } = useTimeSlice({
      data,
      handler,
      onComplete
    })
    
    start()
    
    await vi.runAllTimersAsync()
    
    expect(handler).not.toHaveBeenCalled()
    expect(onComplete).toHaveBeenCalledWith([])
    expect(isRunning.value).toBe(false)
  })

  it("should handle handler with index parameter", async () => {
    const data = ['a', 'b', 'c']
    const handler = vi.fn((item: string, index: number) => `${index}-${item}`)
    const onComplete = vi.fn()
    
    const { start } = useTimeSlice({
      data,
      handler,
      onComplete
    })
    
    start()
    await vi.runAllTimersAsync()
    
    expect(handler).toHaveBeenCalledWith('a', 0)
    expect(handler).toHaveBeenCalledWith('b', 1)
    expect(handler).toHaveBeenCalledWith('c', 2)
    expect(onComplete).toHaveBeenCalledWith(['0-a', '1-b', '2-c'])
  })

  it("should handle complex data processing", async () => {
    interface User {
      id: number
      name: string
      active: boolean
    }
    
    const users: User[] = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Charlie', active: true }
    ]
    
    const handler = vi.fn((user: User) => ({
      ...user,
      displayName: user.active ? user.name : `${user.name} (inactive)`
    }))
    
    const onComplete = vi.fn()
    
    const { start } = useTimeSlice({
      data: users,
      handler,
      onComplete
    })
    
    start()
    await vi.runAllTimersAsync()
    
    expect(onComplete).toHaveBeenCalledWith([
      { id: 1, name: 'Alice', active: true, displayName: 'Alice' },
      { id: 2, name: 'Bob', active: false, displayName: 'Bob (inactive)' },
      { id: 3, name: 'Charlie', active: true, displayName: 'Charlie' }
    ])
  })

  it("should not start if already running", async () => {
    const data = Array.from({ length: 25 }, (_, i) => i) // 创建25个数据项
    const handler = vi.fn((item: number) => item * 2)
    
    const { start, isRunning } = useTimeSlice({
      data,
      handler,
      count: 10, // 每次处理10个
      interval: 100
    })
    
    start()
    expect(isRunning.value).toBe(true)
    
    // 处理第一个时间片
    await vi.advanceTimersByTimeAsync(0)
    expect(handler).toHaveBeenCalledTimes(10)
    expect(isRunning.value).toBe(true) // 还有数据未处理，应该仍在运行
    
    // 尝试再次启动（应该被忽略）
    const initialCallCount = handler.mock.calls.length
    start()
    
    // 不应该重新开始处理
    expect(handler).toHaveBeenCalledTimes(initialCallCount)
    expect(isRunning.value).toBe(true)
  })

  it("should handle restart after completion", async () => {
    const data = [1, 2]
    const handler = vi.fn((item: number) => item * 2)
    const onComplete = vi.fn()
    
    const { start, isRunning } = useTimeSlice({
      data,
      handler,
      onComplete
    })
    
    // 第一次运行
    start()
    await vi.runAllTimersAsync()
    
    expect(isRunning.value).toBe(false)
    expect(onComplete).toHaveBeenCalledTimes(1)
    
    // 重新启动
    start()
    await vi.runAllTimersAsync()
    
    expect(onComplete).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenCalledTimes(4) // 2次运行，每次2个项目
  })
})