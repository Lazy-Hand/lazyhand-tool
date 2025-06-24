import { type Ref, ref } from "vue"

/**
 * 分时函数选项接口
 */
export interface TimeSliceOptions<T, R> {
  /**
   * 需要处理的数据集合
   */
  data: T[]

  /**
   * 每个时间片内处理的项目数量
   */
  count?: number

  /**
   * 每个时间片的间隔时间(ms)
   */
  interval?: number

  /**
   * 处理每一项数据的函数
   */
  handler: (item: T, index: number) => R

  /**
   * 所有数据处理完成后的回调函数
   */
  onComplete?: (result: R[]) => void

  /**
   * 处理进度变化的回调函数
   */
  onProgress?: (completed: number, total: number) => void
}

/**
 * 分时函数返回值接口
 */
export interface TimeSliceResult {
  /**
   * 是否正在执行
   */
  isRunning: Ref<boolean>

  /**
   * 开始执行
   */
  start: () => void

  /**
   * 暂停执行
   */
  pause: () => void

  /**
   * 恢复执行
   */
  resume: () => void

  /**
   * 停止执行
   */
  stop: () => void
}

/**
 * 通用分时函数
 * 将大量任务分割成小块在不同的时间片段内执行，避免长时间占用主线程
 *
 * @param options 分时函数选项
 * @returns 分时函数控制对象
 */
export function useTimeSlice<T, R>(options: TimeSliceOptions<T, R>): TimeSliceResult {
  const { data, count = 10, interval = 16, handler, onComplete, onProgress } = options

  const isRunning = ref(false)
  const isPaused = ref(false)
  let timeoutId: number | null = null
  let currentIndex = 0
  const result: R[] = []

  // 处理一个时间片内的数据
  const processChunk = () => {
    if (!isRunning.value || isPaused.value) return

    const totalLength = data.length
    const end = Math.min(currentIndex + count, totalLength)

    // 处理当前时间片内的数据
    for (let i = currentIndex; i < end; i++) {
      result[i] = handler(data[i], i)
    }

    // 更新进度
    currentIndex = end
    onProgress?.(currentIndex, totalLength)

    // 检查是否完成所有数据处理
    if (currentIndex < totalLength) {
      // 安排下一个时间片
      timeoutId = window.setTimeout(processChunk, interval)
    } else {
      // 所有数据处理完成
      isRunning.value = false
      onComplete?.(result)
    }
  }

  // 开始执行
  const start = () => {
    if (isRunning.value) return

    isRunning.value = true
    isPaused.value = false
    currentIndex = 0
    result.length = 0
    processChunk()
  }

  // 暂停执行
  const pause = () => {
    if (!isRunning.value || isPaused.value) return

    isPaused.value = true
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // 恢复执行
  const resume = () => {
    if (!isRunning.value || !isPaused.value) return

    isPaused.value = false
    processChunk()
  }

  // 停止执行
  const stop = () => {
    if (!isRunning.value) return

    isRunning.value = false
    isPaused.value = false
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    currentIndex = 0
    result.length = 0
  }

  return {
    isRunning,
    start,
    pause,
    resume,
    stop,
  }
}
