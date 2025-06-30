import { cloneDeep } from "radashi"
import { reactive } from "vue"
/**
 * 创建一个可重置的响应式对象
 * @template T - 对象类型，必须是一个键值对记录
 * @param val - 返回初始值的工厂函数
 * @returns [state, reset] - 返回一个元组，包含:
 *   - state: 响应式对象
 *   - reset: 重置函数，调用时将对象重置为初始状态
 * @example
 * ```ts
 * const [state, reset] = useResettableReactive(() => ({ count: 0 }))
 * state.count = 1
 * reset() // state.count 将重置为 0
 * ```
 */
export function useResettableReactive<T extends object>(val: () => T): [T, () => void] {
  const state = reactive(cloneDeep(val()))
  const reset = (): void => {
    for (const key of Object.keys(state)) {
      delete (state as Record<string, unknown>)[key]
    }
    Object.assign(state, cloneDeep(val()))
  }
  return [state as T, reset]
}
