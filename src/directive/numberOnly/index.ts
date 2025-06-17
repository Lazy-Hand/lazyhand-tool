import type { Directive } from "vue"

/**
 * Vue指令：控制输入框只能输入整数
 * @description 限制输入框只能输入整数，可配置输入的最大长度
 * @param {number} binding.value - 可选，限制整数的最大长度，默认为2
 * @example
 * ```vue
 * <input v-integer-only="3" /> // 限制最大长度为3的整数
 * ```
 */
export const integerOnly: Directive = {
  mounted(el: HTMLInputElement, binding) {
    // 中文输入法状态标识
    let isComposing = false
    const limit = binding.value ?? 2 // 默认限制长度2
    if (typeof limit !== "number") throw new Error("v-integer-only 指令的值必须是数字")

    // 监听中文输入法开始
    el.addEventListener("compositionstart", () => {
      isComposing = true
    })
    // 监听中文输入法结束
    el.addEventListener("compositionend", (e) => {
      isComposing = false
      handleInput(e)
    })
    // 监听输入事件
    el.addEventListener("input", handleInput)

    function handleInput(e: Event | CompositionEvent): void {
      // 中文输入法输入过程中不处理
      if (isComposing) return

      const input = e.target as HTMLInputElement
      const cursorPosition = input.selectionStart
      const originalValue = input.value
      // 整数过滤逻辑：仅保留数字并限制总长度
      const newValue = originalValue.replace(/\D/g, "").slice(0, limit)

      if (newValue !== originalValue) {
        input.value = newValue
        // 光标位置调整逻辑（保持原逻辑）
        const lengthDiff = originalValue.length - newValue.length
        const newCursorPos = cursorPosition ? Math.max(0, cursorPosition - lengthDiff) : 0
        input.setSelectionRange(newCursorPos, newCursorPos)
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }

    // 初始值处理
    if (binding.value !== undefined && binding.value !== null) {
      el.value = formatInteger(binding.value, limit)
    }
  },

  // 指令值更新时的处理
  updated(el: HTMLInputElement, binding) {
    const limit = binding.value ?? 2
    if (binding.value !== undefined && binding.value !== null) {
      const formattedValue = formatInteger(binding.value, limit)
      if (formattedValue !== el.value) {
        el.value = formattedValue
      }
    }
  },
}

/**
 * Vue指令：控制输入框只能输入小数
 * @description 限制输入框只能输入小数，可配置小数位精度
 * @param {number} binding.value - 可选，限制小数位数，默认为2
 * @example
 * ```vue
 * <input v-decimal-only="3" /> // 限制3位小数
 * ```
 */
export const decimalOnly: Directive = {
  mounted(el: HTMLInputElement, binding) {
    // 中文输入法状态标识
    let isComposing = false
    const limit = binding.value ?? 2 // 默认精度2位
    if (typeof limit !== "number") throw new Error("v-decimal-only 指令的值必须是数字")

    // 监听中文输入法开始
    el.addEventListener("compositionstart", () => {
      isComposing = true
    })
    // 监听中文输入法结束
    el.addEventListener("compositionend", (e) => {
      isComposing = false
      handleInput(e)
    })
    // 监听输入事件
    el.addEventListener("input", handleInput)

    function handleInput(e: Event | CompositionEvent): void {
      // 中文输入法输入过程中不处理
      if (isComposing) return

      const input = e.target as HTMLInputElement
      const cursorPosition = input.selectionStart
      const originalValue = input.value
      // 小数过滤逻辑：处理小数点和精度限制
      let newValue = originalValue
        .replace(/[^\d.]/g, "") // 过滤非数字/点
        .replace(/^\./, "") // 移除开头的点

      // 只保留第一个小数点，删除后续所有小数点
      const firstDotIndex = newValue.indexOf(".")
      if (firstDotIndex !== -1) {
        newValue = newValue.substring(0, firstDotIndex + 1) + newValue.substring(firstDotIndex + 1).replace(/\./g, "")
      }

      // 处理小数位数限制
      const dotIndex = newValue.indexOf(".")
      if (dotIndex !== -1 && newValue.length - dotIndex - 1 > limit) {
        newValue = newValue.slice(0, dotIndex + limit + 1)
      }

      if (newValue !== originalValue) {
        input.value = newValue
        // 光标位置调整逻辑
        const lengthDiff = originalValue.length - newValue.length
        const newCursorPos = cursorPosition ? Math.max(0, cursorPosition - lengthDiff) : 0
        input.setSelectionRange(newCursorPos, newCursorPos)
        input.dispatchEvent(new Event("input", { bubbles: true }))
      }
    }

    // 初始值处理
    if (binding.value !== undefined && binding.value !== null) {
      el.value = formatDecimal(binding.value, limit)
    }
  },

  // 指令值更新时的处理
  updated(el: HTMLInputElement, binding) {
    const limit = binding.value ?? 2
    if (binding.value !== undefined && binding.value !== null) {
      const formattedValue = formatDecimal(binding.value, limit)
      if (formattedValue !== el.value) {
        el.value = formattedValue
      }
    }
  },
}

/**
 * 整数格式化工具函数
 * @param {string | number} value - 需要格式化的值
 * @param {number} limit - 整数最大长度限制
 * @returns {string} 格式化后的整数字符串
 */
function formatInteger(value: string | number, limit: number): string {
  if (typeof value !== "number" && typeof value !== "string") return ""
  return value.toString().replace(/\D/g, "").slice(0, limit)
}

/**
 * 小数格式化工具函数
 * @param {string | number} value - 需要格式化的值
 * @param {number} limit - 小数位数限制
 * @returns {string} 格式化后的小数字符串
 */
function formatDecimal(value: string | number, limit: number): string {
  if (typeof value !== "number" && typeof value !== "string") return ""
  let formatted = value
    .toString()
    .replace(/[^\d.]/g, "") // 过滤非数字/点
    .replace(/^\./, "") // 移除开头的点

  // 只保留第一个小数点，删除后续所有小数点
  const firstDotIndex = formatted.indexOf(".")
  if (firstDotIndex !== -1) {
    formatted = formatted.substring(0, firstDotIndex + 1) + formatted.substring(firstDotIndex + 1).replace(/\./g, "")
  }

  // 处理小数位数限制
  const dotIndex = formatted.indexOf(".")
  if (dotIndex !== -1 && formatted.length - dotIndex - 1 > limit) {
    formatted = formatted.slice(0, dotIndex + limit + 1)
  }
  return formatted
}
