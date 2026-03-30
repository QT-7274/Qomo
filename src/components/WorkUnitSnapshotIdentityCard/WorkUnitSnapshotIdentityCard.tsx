/**
 * WorkUnitSnapshotIdentityCard
 *
 * B0.1 演示组件：展示 WorkUnitSnapshot 的三层身份结构。
 * - 逻辑身份（workUnitId, name）
 * - 快照/版本身份（snapshotId, versionNumber, contentHash）
 * - 谱系引用（sourceType, lineagePath）
 *
 * 仅用于验证共享语义在 Web 端已可消费，不扩展成完整设计台 UI。
 */

import type { WorkUnitSnapshot } from '../../types/workUnit.types';

interface WorkUnitSnapshotIdentityCardProps {
  snapshot: WorkUnitSnapshot;
}

export function WorkUnitSnapshotIdentityCard({
  snapshot,
}: WorkUnitSnapshotIdentityCardProps) {
  const { identity, snapshot: ver, lineage } = snapshot;

  return (
    <div style={cardStyle}>
      <h2 style={titleStyle}>{identity.name}</h2>
      {identity.description && (
        <p style={descStyle}>{identity.description}</p>
      )}

      <Section title="逻辑身份">
        <Field label="workUnitId" value={identity.workUnitId} mono />
        <Field label="创建时间" value={formatTime(identity.createdAt)} />
      </Section>

      <Section title="快照/版本身份">
        <Field label="snapshotId" value={ver.snapshotId} mono />
        <Field label="versionId" value={ver.versionId} mono />
        <Field label="版本号" value={ver.versionNumber} />
        <Field label="contentHash" value={ver.contentHash} mono />
        <Field
          label="前一版本"
          value={ver.previousVersionId ?? '（无 — 首个版本）'}
          mono={!!ver.previousVersionId}
        />
      </Section>

      <Section title="谱系引用">
        <Field label="来源类型" value={sourceTypeLabel(lineage.sourceType)} />
        {lineage.sourceWorkUnitId && (
          <Field label="来源 Work Unit" value={lineage.sourceWorkUnitId} mono />
        )}
        {lineage.lineagePath.length > 0 && (
          <div style={pathContainerStyle}>
            <span style={labelStyle}>谱系路径：</span>
            <ul style={pathListStyle}>
              {lineage.lineagePath.map((entry) => (
                <li key={`${entry.workUnitId}-${entry.action}-${entry.timestamp}`} style={pathItemStyle}>
                  <span style={monoStyle}>{entry.workUnitId}</span>
                  {' v' + entry.versionNumber}
                  {' — '}
                  <span style={actionBadgeStyle}>{entry.action}</span>
                  {' '}
                  <span style={timeStyle}>{formatTime(entry.timestamp)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {lineage.lineagePath.length === 0 && (
          <Field label="谱系路径" value="（空 — 全新创建）" />
        )}
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 内部子组件
// ---------------------------------------------------------------------------

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionStyle}>
      <h3 style={sectionTitleStyle}>{title}</h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div style={fieldStyle}>
      <span style={labelStyle}>{label}：</span>
      <span style={mono ? monoStyle : undefined}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 格式化辅助
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return iso || '—';
  }
  return d.toLocaleString('zh-CN');
}

function sourceTypeLabel(type: string): string {
  const map: Record<string, string> = {
    created_new: '全新创建',
    cloned_from: '从其它 Work Unit 克隆',
    restored_from: '从历史版本恢复',
  };
  return map[type] ?? type;
}

// ---------------------------------------------------------------------------
// 内联样式（仅演示用途，正式 UI 应使用 Tailwind）
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  maxWidth: 640,
  margin: '2rem auto',
  padding: '1.5rem',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  background: '#fff',
  fontFamily: 'system-ui, sans-serif',
  color: '#1a202c',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  margin: '0 0 0.25rem',
};

const descStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  color: '#718096',
  margin: '0 0 1rem',
};

const sectionStyle: React.CSSProperties = {
  marginTop: '1rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid #edf2f7',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#a0aec0',
  margin: '0 0 0.5rem',
};

const fieldStyle: React.CSSProperties = {
  fontSize: '0.875rem',
  lineHeight: 1.8,
};

const labelStyle: React.CSSProperties = {
  color: '#718096',
};

const monoStyle: React.CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: '0.8rem',
  background: '#f7fafc',
  padding: '0.1rem 0.3rem',
  borderRadius: 4,
  wordBreak: 'break-all',
};

const pathContainerStyle: React.CSSProperties = {
  fontSize: '0.875rem',
};

const pathListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: '0.25rem 0 0 0.5rem',
  margin: 0,
  borderLeft: '2px solid #e2e8f0',
};

const pathItemStyle: React.CSSProperties = {
  lineHeight: 1.8,
  paddingLeft: '0.5rem',
};

const actionBadgeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  background: '#ebf4ff',
  color: '#3182ce',
  padding: '0.1rem 0.4rem',
  borderRadius: 4,
  fontWeight: 500,
};

const timeStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: '#a0aec0',
};

export default WorkUnitSnapshotIdentityCard;
