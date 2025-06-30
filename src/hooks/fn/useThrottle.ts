/**
 * 创建一个节流函数，使用时间戳方式实现，不依赖 setTimeout
 * 
 * 节流原理：在指定时间间隔内，函数最多只能执行一次，后续调用会被忽略直到时间间隔过去
 * 实现方式：使用时间戳记录上次执行时间，每次调用时检查时间间隔是否足够
 * 
 * @template T - 要节流的函数类型
 * @param fn - 需要节流的函数
 * @param delay - 节流时间间隔（毫秒）
 * @returns 返回节流后的函数，该函数不保留原函数的返回值和 this 绑定
 * 
 * @example
 * ```typescript
 * // 基本使用
 * const throttledFn = useThrottle(() => {
 *   console.log('执行了！')
 * }, 1000)
 * 
 * // 快速多次调用，每秒最多执行一次
 * throttledFn() // 立即执行
 * throttledFn() // 被忽略
 * throttledFn() // 被忽略
 * // 1秒后再调用
 * throttledFn() // 执行
 * 
 * // 带参数的函数
 * const throttledScroll = useThrottle((scrollY: number) => {
 *   console.log('滚动位置:', scrollY)
 * }, 100)
 * 
 * // 滚动事件处理
 * window.addEventListener('scroll', () => {
 *   throttledScroll(window.scrollY) // 每100ms最多执行一次
 * })
 * 
 * // 按钮点击防止重复提交
 * const throttledSubmit = useThrottle(() => {
 *   console.log('提交表单')
 * }, 2000)
 * ```
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  // 记录上次执行的时间戳，初始值为0表示从未执行过
  let lastExecuteTime = 0

  // 返回节流后的函数
  return (...args: Parameters<T>) => {
    // 获取当前时间戳
    const now = Date.now()
    
    // 检查距离上次执行是否已经过了指定的时间间隔
    if (now - lastExecuteTime >= delay) {
      // 时间间隔足够，更新执行时间并立即执行函数
      lastExecuteTime = now
      fn(...args)
    }
    // 如果时间间隔不够，直接忽略本次调用
  }
}
