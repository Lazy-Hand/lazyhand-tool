/**
 * 创建一个防抖函数，使用时间戳方式实现，不依赖 setTimeout
 * 
 * 防抖原理：在指定延迟时间内，如果函数被多次调用，只有最后一次调用会在延迟后执行
 * 实现方式：使用时间戳记录最后调用时间，通过 requestAnimationFrame 或 Promise 进行轮询检查
 * 
 * @template T - 要防抖的函数类型
 * @param fn - 需要防抖的函数
 * @param delay - 防抖延迟时间（毫秒）
 * @returns 返回防抖后的函数，该函数不保留原函数的返回值和 this 绑定
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const debouncedFn = useDebounce(() => {
 *   console.log('执行了！')
 * }, 300)
 * 
 * // 多次快速调用，只有最后一次会执行
 * debouncedFn() // 不会执行
 * debouncedFn() // 不会执行
 * debouncedFn() // 300ms 后执行
 * 
 * // 带参数的函数
 * const debouncedSearch = useDebounce((query: string) => {
 *   console.log('搜索:', query)
 * }, 500)
 * 
 * debouncedSearch('a')    // 不会执行
 * debouncedSearch('ab')   // 不会执行
 * debouncedSearch('abc')  // 500ms 后执行，参数为 'abc'
 * ```
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  // 记录最后一次调用的时间戳
  let lastCallTime = 0
  // 保存最后一次调用的参数
  let lastArgs: Parameters<T>
  // 执行ID，用于取消过期的执行计划
  let executeId = 0

  /**
   * 调度执行函数
   * @param currentId - 当前执行ID，用于判断是否为最新的调用
   */
  const scheduleExecution = (currentId: number) => {
    /**
     * 检查时间并决定是否执行函数
     */
    const checkTime = () => {
      const now = Date.now()
      const timeSinceLastCall = now - lastCallTime

      // 检查是否是最新的调用ID，避免过期的执行
      // 如果不是最新的ID，说明有新的调用产生，当前执行应该被取消
      if (currentId !== executeId) {
        return
      }

      // 检查是否已经过了延迟时间
      if (timeSinceLastCall >= delay) {
        // 时间到了，执行函数
        fn(...lastArgs)
      } else {
        // 时间还没到，继续等待剩余时间
        // 优先使用 requestAnimationFrame，在浏览器环境中性能更好
        // 在 Node.js 环境中使用 Promise.resolve().then
        if (typeof requestAnimationFrame !== "undefined") {
          requestAnimationFrame(checkTime)
        } else {
          Promise.resolve().then(checkTime)
        }
      }
    }

    // 开始第一次时间检查
    if (typeof requestAnimationFrame !== "undefined") {
      requestAnimationFrame(checkTime)
    } else {
      Promise.resolve().then(checkTime)
    }
  }

  // 返回防抖后的函数
  return (...args: Parameters<T>) => {
    // 更新最后调用时间为当前时间
    lastCallTime = Date.now()
    // 保存当前调用的参数
    lastArgs = args

    // 每次调用都生成新的执行ID，这样可以取消之前的执行计划
    // 实现防抖效果：只有最后一次调用会被执行
    executeId++
    scheduleExecution(executeId)
  }
}
