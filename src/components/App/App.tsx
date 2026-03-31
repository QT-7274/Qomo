/**
 * Qomo B0.1 + B0.2 演示入口
 *
 * B0.1: WorkUnitSnapshot 的三层身份语义
 * B0.2: Decision / Writeback / Observation 分层词汇
 *
 * 仅用于验证共享语义在 Web 端已可消费，不是正式设计台 UI。
 */

import { useState, useMemo } from 'react';
import { WorkUnitSnapshotIdentityCard } from '../WorkUnitSnapshotIdentityCard';
import { DecisionWritebackDemo } from '../DecisionWritebackDemo';
import {
  buildWorkUnitSnapshot,
  createWorkUnitIdentity,
  createSnapshotIdentity,
  createCloneLineage,
} from '../../utils/workUnitSnapshotHelper';
import type { WorkUnitSnapshot } from '../../types/workUnit.types';
import './App.css';

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

type DemoTab = 'b01' | 'b02';

function App() {
  const [activeTab, setActiveTab] = useState<DemoTab>('b02');

  const freshSnapshot = useMemo(
    () =>
      buildWorkUnitSnapshot({
        name: '代码审查助手',
        description: '用于辅助代码审查的 Prompt 工作单元',
        contentHash: 'sha256_demo_fresh_001',
      }),
    [],
  );

  const clonedSnapshot = useMemo(() => {
    const sourceId = 'wu_source_demo_001';
    const identity = createWorkUnitIdentity(
      '代码审查助手（副本）',
      '从「代码审查助手」克隆而来',
    );
    const snapshot = createSnapshotIdentity(
      identity.workUnitId,
      '1.0.0',
      'sha256_demo_clone_001',
    );
    const lineage = createCloneLineage(sourceId, '2.1.0', identity.workUnitId);
    return { identity, snapshot, lineage } as WorkUnitSnapshot;
  }, []);

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style}>Qomo Backbone 演示</h1>
        <p style={subtitleStyle}>
          B0.1 对象身份语义 · B0.2 决策/回写/观测分层词汇
        </p>
      </header>

      {/* Tab 切换 */}
      <nav style={tabBarStyle}>
        <button
          type="button"
          style={activeTab === 'b01' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('b01')}
        >
          B0.1 身份语义
        </button>
        <button
          type="button"
          style={activeTab === 'b02' ? activeTabStyle : tabStyle}
          onClick={() => setActiveTab('b02')}
        >
          B0.2 决策/回写/观测
        </button>
      </nav>

      {/* B0.1 内容 */}
      {activeTab === 'b01' && (
        <div style={gridStyle}>
          <div>
            <h2 style={scenarioTitleStyle}>场景 1：全新创建</h2>
            <WorkUnitSnapshotIdentityCard snapshot={freshSnapshot} />
          </div>
          <div>
            <h2 style={scenarioTitleStyle}>场景 2：克隆</h2>
            <WorkUnitSnapshotIdentityCard snapshot={clonedSnapshot} />
          </div>
        </div>
      )}

      {/* B0.2 内容 */}
      {activeTab === 'b02' && (
        <DecisionWritebackDemo />
      )}
    </div>
  );
}

export default App;

// ---------------------------------------------------------------------------
// 布局样式（演示专用）
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  maxWidth: 960,
  margin: '0 auto',
  padding: '2rem 1rem',
  fontFamily: 'system-ui, sans-serif',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '1.5rem',
};

const h1Style: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  margin: 0,
  color: '#1a202c',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: '#718096',
  marginTop: '0.5rem',
};

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  borderBottom: '2px solid #e2e8f0',
  paddingBottom: '0.5rem',
};

const tabStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  fontSize: '0.9rem',
  color: '#718096',
  borderRadius: '4px 4px 0 0',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: '#1a202c',
  fontWeight: 600,
  background: '#edf2f7',
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const scenarioTitleStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: '#4a5568',
  marginBottom: '0.25rem',
  paddingLeft: '0.5rem',
};
