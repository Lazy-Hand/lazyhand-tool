import type { Ref } from "vue"
import { cloneDeep } from "radashi"
import { ref } from "vue"

/**
 * 创建一个可重置的响应式引用
 * @template T - 对象类型，必须是一个键值对记录
 * @param val - 返回初始值的工厂函数
 * @returns [ref, reset] - 返回一个元组，包含:
 *   - ref: 响应式引用对象
 *   - reset: 重置函数，调用时将值重置为初始状态
 * @example
 * ```ts
 * const [state, reset] = useResettableRef(() => ({ count: 0 }))
 * state.value.count = 1
 * reset() // state.value.count 将重置为 0
 * ```
 */
export function useResettableRef<T extends object>(val: () => T): [Ref<T>, () => void] {
  const initialValue = cloneDeep(val())
  const state = ref<T>(val())
  const reset = (): void => {
    state.value = cloneDeep(initialValue)
  }
  return [state as Ref<T>, reset]
}
