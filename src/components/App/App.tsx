/**
 * Qomo B0.1 演示入口
 *
 * 展示 WorkUnitSnapshot 的三层身份语义：
 * 1. 全新创建的 Work Unit
 * 2. 从另一个 Work Unit 克隆
 *
 * 仅用于验证共享语义在 Web 端已可消费，不是正式设计台 UI。
 */

import { WorkUnitSnapshotIdentityCard } from '../WorkUnitSnapshotIdentityCard';
import {
  buildWorkUnitSnapshot,
  createWorkUnitIdentity,
  createSnapshotIdentity,
  createCloneLineage,
} from '../../utils/workUnitSnapshotHelper';
import type { WorkUnitSnapshot } from '../../types/workUnit.types';
import './App.css';

// ---------------------------------------------------------------------------
// 演示数据：两种谱系场景
// ---------------------------------------------------------------------------

/** 场景 1：全新创建 */
const freshSnapshot = buildWorkUnitSnapshot({
  name: '代码审查助手',
  description: '用于辅助代码审查的 Prompt 工作单元',
  contentHash: 'sha256_demo_fresh_001',
});

/** 场景 2：从已有 Work Unit 克隆 */
function createClonedDemo(): WorkUnitSnapshot {
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

  return { identity, snapshot, lineage };
}
const clonedSnapshot = createClonedDemo();

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App() {
  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={h1Style}>Qomo B0.1 — 对象身份语义演示</h1>
        <p style={subtitleStyle}>
          验证 WorkUnitSnapshot 的三层身份结构：逻辑身份 · 快照/版本身份 · 谱系引用
        </p>
      </header>

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
  marginBottom: '2rem',
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
