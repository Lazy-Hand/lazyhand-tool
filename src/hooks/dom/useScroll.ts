import { onMounted, onUnmounted, type Ref, ref } from "vue"
/**
 * 用于监听页面滚动状态的 Hook
 * @returns {Object} 返回滚动相关的状态和方法
 * - scrollTop: 当前滚动位置
 * - isBottom: 是否滚动到底部
 * - scrollDirection: 滚动方向('up'|'down'|'none')
 * - scrollToTop: 滚动到顶部的方法
 * @example
 * ```ts
 * const { scrollTop, isBottom, scrollDirection, scrollToTop } = useScroll()
 * // 可以通过这些值监听页面滚动状态
 * ```
 */
export const useScroll = (): {
  scrollTop: Ref<number>
  isBottom: Ref<boolean>
  scrollDirection: Ref<"up" | "down" | "none">
  scrollToTop: () => void
} => {
  // 当前滚动位置
  const scrollTop = ref(0)
  // 是否滚动到底部
  const isBottom = ref(false)
  // 滚动方向
  const scrollDirection = ref<"up" | "down" | "none">("none")
  // 上一次的滚动位置，用于判断滚动方向
  const prevScrollTop = ref(0)

  /**
   * 平滑滚动到页面顶部
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  /**
   * 处理滚动事件
   * @param event - 滚动事件对象
   */
  const handleScroll = (event: Event) => {
    // 获取当前滚动位置
    scrollTop.value = window.pageYOffset || document.documentElement.scrollTop

    // 计算是否滚动到底部
    const scrollHeight = (event.target as HTMLElement)?.scrollHeight
    const clientHeight = (event.target as HTMLElement)?.clientHeight
    if (scrollTop.value + clientHeight >= scrollHeight) {
      isBottom.value = true
    } else {
      isBottom.value = false
    }

    // 判断滚动方向
    const currentScrollTop = scrollTop.value
    if (currentScrollTop > prevScrollTop.value) {
      scrollDirection.value = "down"
    } else if (currentScrollTop < prevScrollTop.value) {
      scrollDirection.value = "up"
    } else {
      scrollDirection.value = "none"
    }

    // 更新上一次滚动位置
    prevScrollTop.value = currentScrollTop
  }

  // 组件挂载时添加滚动事件监听
  onMounted(() => {
    window.addEventListener("scroll", handleScroll)
  })

  // 组件卸载时移除滚动事件监听
  onUnmounted(() => {
    window.removeEventListener("scroll", handleScroll)
  })

  return {
    scrollTop,
    isBottom,
    scrollDirection,
    scrollToTop,
  }
}
