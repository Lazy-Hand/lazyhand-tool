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
 * 通用分时函数 - 时间切片处理大数据集
 *
 * 将大量数据处理任务分割成小块，在不同的时间片段内执行，避免长时间占用主线程导致页面卡顿。
 * 这种技术常用于处理大量DOM操作、数据转换、图像处理等耗时任务。
 *
 * 核心原理：
 * 1. 将大数据集按指定数量分割成多个小块
 * 2. 每处理完一个小块后，使用 setTimeout 让出主线程控制权
 * 3. 浏览器可以在间隔时间内处理其他任务（如用户交互、渲染等）
 * 4. 然后继续处理下一个小块，直到所有数据处理完成
 *
 * 性能优势：
 * - 避免长时间阻塞主线程
 * - 保持页面响应性和流畅性
 * - 可以实时显示处理进度
 * - 支持暂停、恢复、停止操作
 *
 * @template T - 输入数据项的类型
 * @template R - 处理结果项的类型
 * @param options - 分时函数配置选项
 * @param options.data - 需要处理的数据集合
 * @param options.count - 每个时间片内处理的项目数量，默认10个。数量越大处理越快但可能造成卡顿
 * @param options.interval - 每个时间片的间隔时间(ms)，默认16ms。间隔越短处理越快但占用资源越多
 * @param options.handler - 处理每一项数据的函数，接收数据项和索引，返回处理结果
 * @param options.onComplete - 所有数据处理完成后的回调函数，接收完整的结果数组
 * @param options.onProgress - 处理进度变化的回调函数，接收已完成数量和总数量
 * @returns 分时函数控制对象，包含执行状态和控制方法
 *
 * @example
 * ```typescript
 * // 基本使用 - 处理大量数据
 * const numbers = Array.from({ length: 100000 }, (_, i) => i)
 *
 * const timeSlice = useTimeSlice({
 *   data: numbers,
 *   count: 1000, // 每次处理1000个
 *   interval: 10, // 间隔10ms
 *   handler: (num) => num * 2, // 处理函数：乘以2
 *   onProgress: (completed, total) => {
 *     console.log(`进度: ${completed}/${total} (${(completed/total*100).toFixed(1)}%)`)
 *   },
 *   onComplete: (results) => {
 *     console.log('处理完成！', results.length)
 *   }
 * })
 *
 * // 开始处理
 * timeSlice.start()
 *
 * // 控制执行
 * timeSlice.pause()  // 暂停
 * timeSlice.resume() // 恢复
 * timeSlice.stop()   // 停止
 *
 * // 在Vue组件中使用
 * const { isRunning } = timeSlice
 * // isRunning.value 可以用于显示加载状态
 *
 * // 处理DOM操作示例
 * const items = Array.from({ length: 10000 }, (_, i) => ({ id: i, name: `Item ${i}` }))
 *
 * const domProcessor = useTimeSlice({
 *   data: items,
 *   count: 50, // 每次处理50个DOM元素
 *   handler: (item) => {
 *     // 创建DOM元素
 *     const div = document.createElement('div')
 *     div.textContent = item.name
 *     div.id = `item-${item.id}`
 *     return div
 *   },
 *   onComplete: (elements) => {
 *     // 批量添加到页面
 *     const container = document.getElementById('container')
 *     elements.forEach(el => container?.appendChild(el))
 *   }
 * })
 *
 * // 图像处理示例
 * const imageProcessor = useTimeSlice({
 *   data: imageDataArray,
 *   count: 100, // 每次处理100个像素
 *   handler: (pixel, index) => {
 *     // 图像滤镜处理
 *     return {
 *       r: Math.min(255, pixel.r * 1.2),
 *       g: Math.min(255, pixel.g * 1.1),
 *       b: Math.min(255, pixel.b * 0.9)
 *     }
 *   },
 *   onProgress: (completed, total) => {
 *     updateProgressBar(completed / total)
 *   }
 * })
 * ```
 *
 * @note 注意事项
 * - count 和 interval 需要根据具体场景调整，在性能和响应性之间找到平衡
 * - 处理函数应该尽量简单快速，避免在单个处理函数中执行耗时操作
 * - 适用于CPU密集型任务，对于I/O密集型任务建议使用其他方案
 * - 在组件卸载时记得调用 stop() 方法清理资源
 */
export function useTimeSlice<T, R>(options: TimeSliceOptions<T, R>): TimeSliceResult {
  // 解构配置选项，设置默认值
  const { data, count = 10, interval = 16, handler, onComplete, onProgress } = options

  // 响应式状态：是否正在运行
  const isRunning = ref(false)
  // 响应式状态：是否已暂停
  const isPaused = ref(false)
  // 定时器ID，用于清理定时器
  let timeoutId: number | null = null
  // 当前处理到的数据索引
  let currentIndex = 0
  // 存储处理结果的数组
  const result: R[] = []

  /**
   * 处理一个时间片内的数据
   * 这是分时函数的核心逻辑，每次处理指定数量的数据项
   */
  const processChunk = () => {
    // 检查执行状态，如果已停止或暂停则直接返回
    if (!isRunning.value || isPaused.value) return

    const totalLength = data.length
    // 计算当前时间片的结束索引，确保不超过数据总长度
    const end = Math.min(currentIndex + count, totalLength)

    // 处理当前时间片内的数据
    // 使用同步循环处理，确保在单个时间片内完成
    for (let i = currentIndex; i < end; i++) {
      result[i] = handler(data[i], i)
    }

    // 更新当前处理进度
    currentIndex = end
    // 触发进度回调，通知外部当前处理进度
    onProgress?.(currentIndex, totalLength)

    // 检查是否完成所有数据处理
    if (currentIndex < totalLength) {
      // 还有数据未处理，安排下一个时间片
      // 使用 setTimeout 让出主线程控制权，允许浏览器处理其他任务
      timeoutId = window.setTimeout(processChunk, interval)
    } else {
      // 所有数据处理完成
      isRunning.value = false
      // 触发完成回调，传递完整的处理结果
      onComplete?.(result)
    }
  }

  /**
   * 开始执行分时处理
   * 重置所有状态并开始第一个时间片的处理
   */
  const start = () => {
    // 防止重复启动
    if (isRunning.value) return

    // 设置运行状态
    isRunning.value = true
    isPaused.value = false
    // 重置处理进度
    currentIndex = 0
    // 清空之前的结果
    result.length = 0
    // 开始处理第一个时间片
    processChunk()
  }

  /**
   * 暂停执行
   * 保持当前进度，可以通过 resume 恢复
   */
  const pause = () => {
    // 只有在运行且未暂停时才能暂停
    if (!isRunning.value || isPaused.value) return

    // 设置暂停状态
    isPaused.value = true
    // 清理当前的定时器，停止下一个时间片的调度
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  /**
   * 恢复执行
   * 从暂停的位置继续处理
   */
  const resume = () => {
    // 只有在运行且已暂停时才能恢复
    if (!isRunning.value || !isPaused.value) return

    // 取消暂停状态
    isPaused.value = false
    // 继续处理当前时间片
    processChunk()
  }

  /**
   * 停止执行
   * 完全停止处理，清理所有状态和资源
   */
  const stop = () => {
    // 只有在运行时才需要停止
    if (!isRunning.value) return

    // 重置所有状态
    isRunning.value = false
    isPaused.value = false
    // 清理定时器
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    // 重置处理进度和结果
    currentIndex = 0
    result.length = 0
  }

  // 返回控制对象，提供状态查询和操作方法
  return {
    isRunning,
    start,
    pause,
    resume,
    stop,
  }
}
