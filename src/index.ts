import type { App, Directive } from "vue";

export * from "./components";
// 全局导出hooks
export * from "./hooks";

// 注册指令
import * as directive from "./directive";
export function lazyhandTool(app: App) {
	for (const key of Object.keys(directive)) {
		app.directive(key, (directive as Record<string, Directive>)[key]);
	}
}
