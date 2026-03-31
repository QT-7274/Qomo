/**
 * Capability 共享类型定义
 *
 * W2a Story: 为 Slot 提供可组合的能力片段。
 *
 * 每个 Capability 代表一段可复用的 Prompt 内容，
 * 挂载在特定 Slot 下，通过 order 控制组装顺序。
 *
 * === 扩展预留 ===
 * W2b 可能增加：约束语义标签、输出格式声明
 * W2c 可能增加：待补齐标记、版本引用
 */

/** Slot 下的能力片段 */
export interface Capability {
  /** 唯一 ID（UUID） */
  readonly id: string;

  /** 用户可见名称 */
  name: string;

  /** 文本内容（Prompt 片段） */
  content: string;

  /** 排序序号（0-based，值越小越靠前） */
  order: number;
}
