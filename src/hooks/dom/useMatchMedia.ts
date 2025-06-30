import { onMounted, onUnmounted, type Ref, ref } from "vue"

/**
 * 用于监听媒体查询状态变化的 Hook
 * @param query - 媒体查询字符串，例如 '(max-width: 768px)'
 * @returns {Ref<boolean>} - 返回当前媒体查询的匹配状态的响应式引用
 * @example
 * ```ts
 * const isMobile = useMatchMedia('(max-width: 768px)')
 * // isMobile 将随着窗口大小变化而更新
 * ```
 */
export const useMatchMedia = (query: string): Ref<boolean> => {
  const mediaQuery = window.matchMedia(query)
  const match = ref(mediaQuery.matches)

  const onChange = (e: MediaQueryListEvent) => {
    match.value = e.matches
  }

  onMounted(() => {
    mediaQuery.addEventListener("change", onChange)
  })
  onUnmounted(() => {
    mediaQuery.removeEventListener("change", onChange)
  })
  return match
}
