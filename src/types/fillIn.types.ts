/**
 * FillIn 共享类型定义
 *
 * W2c Story: 为 Slot 提供待补齐项语义声明。
 *
 * 三种补齐方式：
 * - auto: 可从 workspace 自动提取（如仓库路径、当前文件）
 * - user-confirm: 需用户显式确认（如任务目标、关键上下文）
 * - manual: 需手动输入或标记暂缺（如特殊要求、临时补充）
 *
 * === 扩展预留 ===
 * V2 可能增加：运行时补齐状态、实际填入值
 * W3 可能增加：交接准备时的待补齐摘要展示
 */

/** 补齐方式 */
export type FillInMethod = 'auto' | 'user-confirm' | 'manual';

/** 待补齐声明 */
export interface FillInDeclaration {
  /** 补齐方式 */
  method: FillInMethod;
  /** 提示文本，向 VS Code 端说明该位需要什么信息 */
  hint?: string;
}
