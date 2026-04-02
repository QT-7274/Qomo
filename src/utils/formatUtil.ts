/**
 * 格式化辅助工具
 *
 * V1 Story: 从组件中提取的通用纯函数。
 */

/** 将 ISO 时间字符串格式化为中文相对时间 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return date.toLocaleDateString('zh-CN');

  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHr < 24) return `${diffHr} 小时前`;
  if (diffDay < 30) return `${diffDay} 天前`;
  return date.toLocaleDateString('zh-CN');
}

/** 来源类型的中文标签 */
export function sourceTypeLabel(sourceType: string): string {
  switch (sourceType) {
    case 'created_new': return '全新';
    case 'cloned_from': return '克隆';
    case 'restored_from': return '恢复';
    default: return sourceType;
  }
}
