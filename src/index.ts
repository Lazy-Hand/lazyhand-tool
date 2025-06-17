import type { App, Directive } from "vue"

// 全局导出组件
export { default as Button } from "./Button.vue"

// 全局导出hooks
export { useResettableRef, useResettableReactive } from "./hooks"

// 注册指令
import * as directive from "./directive"
export function lazyhandTool(app: App) {
  for (const key of Object.keys(directive)) {
    app.directive(key, (directive as Record<string, Directive>)[key])
  }
}
