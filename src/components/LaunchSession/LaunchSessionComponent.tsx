/**
 * LaunchSessionComponent — 启动会话（V1 + V2）
 *
 * V1 Story: 展示选中 Work Unit 的结构摘要。
 * V2 Story: 现场补齐上下文（LaunchContextEnvelope）。
 *
 * 通过 useLaunchSession + useLaunchContext hook 加载数据，遵守分层架构。
 */

import { useParams, Link } from 'react-router-dom';
import { useLaunchSession } from '../../hooks/useLaunchSession';
import { useLaunchContext } from '../../hooks/useLaunchContext';
import { ContextCompletionSection } from './ContextCompletionSection';

const slotTypeLabels: Record<string, string> = {
  context: '上下文', rule: '规则', output: '输出', capability: '能力', custom: '自定义',
};

function handoffLabel(status: string): string {
  switch (status) {
    case 'ready': return '✅ 可交接';
    case 'partial': return '⚠️ 部分准备';
    case 'incomplete': return '❌ 需完善';
    default: return status;
  }
}

export function LaunchSessionComponent() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, error } = useLaunchSession(id);
  const ctx = useLaunchContext(
    data?.slots ?? [],
    id ?? '',
    data?.snapshotId,
  );

  if (loading) {
    return <div style={pageStyle}><p>加载中…</p></div>;
  }

  if (error || !data) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#e53e3e' }}>错误：{error ?? 'Work Unit 不存在'}</p>
        <Link to="/launch" style={linkStyle}>返回启动台</Link>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <Link to="/launch" style={linkStyle}>← 返回启动台</Link>
      </header>

      <h1 style={titleStyle}>{data.name}</h1>
      {data.description && <p style={descStyle}>{data.description}</p>}

      <div style={metaRowStyle}>
        <span style={statusBadge}>{handoffLabel(data.handoffStatus)}</span>
        {data.usingSnapshot && (
          <span style={snapshotBadge}>
            📸 使用快照 v{data.snapshotVersionNumber}
          </span>
        )}
        {!data.usingSnapshot && (
          <span style={draftBadge}>📝 当前编辑版本（无快照）</span>
        )}
      </div>

      {/* 快照降级警告 */}
      {data.snapshotWarning && (
        <div style={warningStyle}>
          ⚠️ {data.snapshotWarning}
        </div>
      )}

      {/* 结构摘要 */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>结构摘要</h2>

        {data.slots.length > 0 ? (
          <ul style={slotListStyle}>
            {data.slots.map((slot) => (
              <li key={slot.id} style={slotItemStyle}>
                <span style={slotNameStyle}>{slot.name}</span>
                <span style={slotTypeStyle}>
                  {slotTypeLabels[slot.slotType] ?? slot.slotType}
                </span>
                {slot.required && <span style={requiredTag}>必需</span>}
                <span style={capCountStyle}>
                  {slot.capabilities.length} 个能力
                </span>
                {slot.fillIn && <span style={fillInTag}>待补齐</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={emptyHint}>暂无 Slot</p>
        )}

        <p style={constraintSummary}>
          约束包：{data.constraints.length} 个
        </p>
      </section>

      {/* V2: 现场补齐上下文 */}
      <ContextCompletionSection ctx={ctx} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 样式
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '2rem 1rem',
  fontFamily: 'system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  marginBottom: '1rem',
};

const linkStyle: React.CSSProperties = {
  color: '#3182ce',
  textDecoration: 'none',
  fontSize: '0.9rem',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1a202c',
  marginBottom: '0.25rem',
};

const descStyle: React.CSSProperties = {
  color: '#718096',
  marginBottom: '1rem',
};

const metaRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  alignItems: 'center',
  marginBottom: '0.5rem',
};

const statusBadge: React.CSSProperties = {
  padding: '0.2rem 0.6rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 500,
  background: '#edf2f7',
};

const snapshotBadge: React.CSSProperties = {
  padding: '0.2rem 0.6rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  background: '#ebf8ff',
  color: '#2b6cb0',
};

const draftBadge: React.CSSProperties = {
  padding: '0.2rem 0.6rem',
  borderRadius: '4px',
  fontSize: '0.75rem',
  background: '#fefcbf',
  color: '#975a16',
};

const warningStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  background: '#fefcbf',
  border: '1px solid #f6e05e',
  borderRadius: '6px',
  color: '#975a16',
  fontSize: '0.85rem',
  marginBottom: '1.5rem',
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '1.5rem',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '0.75rem',
};

const slotListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const slotItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0',
  borderBottom: '1px solid #edf2f7',
  flexWrap: 'wrap',
};

const slotNameStyle: React.CSSProperties = {
  fontWeight: 500,
  color: '#2d3748',
};

const slotTypeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#718096',
  padding: '0.1rem 0.4rem',
  background: '#edf2f7',
  borderRadius: '4px',
};

const requiredTag: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#e53e3e',
  padding: '0.1rem 0.3rem',
  background: '#fed7d7',
  borderRadius: '4px',
};

const capCountStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#a0aec0',
};

const fillInTag: React.CSSProperties = {
  fontSize: '0.7rem',
  color: '#975a16',
  padding: '0.1rem 0.3rem',
  background: '#fefcbf',
  borderRadius: '4px',
};

const emptyHint: React.CSSProperties = {
  color: '#a0aec0',
  fontStyle: 'italic',
};

const constraintSummary: React.CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.85rem',
  color: '#718096',
};
