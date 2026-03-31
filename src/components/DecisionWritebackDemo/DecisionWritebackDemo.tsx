import { useMemo } from 'react';
import { buildWorkUnitSnapshot } from '../../utils/workUnitSnapshotHelper';
import {
  createLaunchDecision,
  createWritebackSummary,
  createFailedWriteback,
  createDecisionEvent,
  createHandoffEvent,
  createWritebackEvent,
  createObservationEvent,
} from '../../utils/decisionHelper';
import type { HandoffResult } from '../../types/writeback.types';
import type { AnyObservationEvent } from '../../types/observation.types';

/**
 * B0.2 演示组件：展示 LaunchDecision、MinimalWritebackSummary、观测事件的分层结构。
 *
 * 覆盖三个场景：
 * 1. 正常启动 → 成功交付 → 成功回写
 * 2. 正常启动 → 交付失败（独立 outcome）
 * 3. 正常启动 → 成功交付 → 回写失败（独立 outcome）
 */
export function DecisionWritebackDemo() {
  const scenarios = useMemo(() => {
    const snapshot = buildWorkUnitSnapshot({
      name: '编码任务启动 Work Unit',
      description: 'B0.2 演示用 Work Unit',
      contentHash: 'sha256_demo_b02',
    });
    const { workUnitId } = snapshot.identity;
    const { versionId } = snapshot.snapshot;

    // ─── 场景 1: 正常决策 → 成功交付 → 成功回写 ───
    const decision1 = createLaunchDecision({
      workUnitId,
      snapshotVersionId: versionId,
      resultType: 'continue',
    });

    const handoff1: HandoffResult = {
      resultType: 'copied',
      outcome: 'success',
      completedAt: new Date().toISOString(),
    };

    const writeback1 = createWritebackSummary({
      decisionId: decision1.decisionId,
      workUnitId,
      snapshotVersionId: versionId,
      decisionResult: 'continue',
      handoffResult: handoff1,
      writebackOutcome: 'success',
    });

    const events1: AnyObservationEvent[] = [
      createDecisionEvent(decision1),
      createHandoffEvent(decision1.decisionId, workUnitId, handoff1),
      createWritebackEvent(writeback1),
      createObservationEvent(decision1.decisionId, workUnitId, 'delivery_completion', 'recorded', '交付完成'),
    ];

    // ─── 场景 2: 正常决策 → 交付失败 ───
    const decision2 = createLaunchDecision({
      workUnitId,
      snapshotVersionId: versionId,
      resultType: 'degrade',
      issues: [{ capabilityName: 'MCP-FileAccess', issueType: 'permission_denied', description: '文件访问权限不足' }],
      fallbackOptions: [{ optionType: 'degrade', description: '跳过文件上下文，使用手动输入' }],
      selectedFallback: { optionType: 'degrade', description: '跳过文件上下文，使用手动输入' },
    });

    const handoff2: HandoffResult = {
      resultType: 'copied',
      outcome: 'failure',
      failureReason: 'Clipboard API 不可用',
      completedAt: new Date().toISOString(),
    };

    const events2: AnyObservationEvent[] = [
      createDecisionEvent(decision2),
      createHandoffEvent(decision2.decisionId, workUnitId, handoff2),
    ];

    // ─── 场景 3: 正常决策 → 成功交付 → 回写失败 ───
    const decision3 = createLaunchDecision({
      workUnitId,
      snapshotVersionId: versionId,
      resultType: 'continue',
    });

    const handoff3: HandoffResult = {
      resultType: 'downloaded',
      outcome: 'success',
      completedAt: new Date().toISOString(),
    };

    const writeback3 = createFailedWriteback({
      decisionId: decision3.decisionId,
      workUnitId,
      snapshotVersionId: versionId,
      decisionResult: 'continue',
      failureReason: 'IndexedDB 写入超时',
    });

    const events3: AnyObservationEvent[] = [
      createDecisionEvent(decision3),
      createHandoffEvent(decision3.decisionId, workUnitId, handoff3),
      createWritebackEvent(writeback3),
      createObservationEvent(decision3.decisionId, workUnitId, 'general', 'failure', '回写失败，观测数据不完整'),
    ];

    return [
      { title: '场景 1: 正常决策 → 成功交付 → 成功回写', decision: decision1, writeback: writeback1, events: events1 },
      { title: '场景 2: 降级决策 → 交付失败（独立 outcome）', decision: decision2, writeback: null, events: events2 },
      { title: '场景 3: 正常决策 → 成功交付 → 回写失败（独立 outcome）', decision: decision3, writeback: writeback3, events: events3 },
    ];
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h2 style={{ borderBottom: '2px solid #333', paddingBottom: 8 }}>
        B0.2 Decision / Writeback / Observation 分层演示
      </h2>
      <p style={{ color: '#666', fontSize: 13 }}>
        展示 result / action / outcome 三层分离：LaunchDecision.resultType 只有四值，
        交付失败和回写失败作为独立 outcome 存在。
      </p>

      {scenarios.map((scenario, idx) => (
        <section
          key={`scenario-${idx}-${scenario.decision.decisionId}`}
          style={{ marginBottom: 32, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}
        >
          <h3 style={{ margin: '0 0 12px 0', color: '#1a1a2e' }}>{scenario.title}</h3>

          {/* Decision */}
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#4a6fa5' }}>LaunchDecision</h4>
            <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, overflow: 'auto' }}>
              {JSON.stringify({
                decisionId: scenario.decision.decisionId,
                resultType: scenario.decision.resultType,
                issueCount: scenario.decision.context.issues.length,
                selectedFallback: scenario.decision.selectedFallback?.description ?? null,
              }, null, 2)}
            </pre>
          </div>

          {/* Writeback */}
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: '0 0 4px 0', color: '#4a6fa5' }}>MinimalWritebackSummary</h4>
            {scenario.writeback ? (
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify({
                  writebackId: scenario.writeback.writebackId,
                  decisionResult: scenario.writeback.decisionResult,
                  writebackOutcome: scenario.writeback.writebackOutcome,
                  writebackFailureReason: scenario.writeback.writebackFailureReason ?? null,
                  handoffOutcome: scenario.writeback.handoffResult?.outcome ?? null,
                }, null, 2)}
              </pre>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic', margin: 4 }}>无回写（交付失败，未到达回写阶段）</p>
            )}
          </div>

          {/* Events */}
          <div>
            <h4 style={{ margin: '0 0 4px 0', color: '#4a6fa5' }}>观测事件（分层）</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#eee' }}>
                  <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #ddd' }}>层级</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #ddd' }}>Outcome</th>
                  <th style={{ padding: '4px 8px', textAlign: 'left', border: '1px solid #ddd' }}>详情</th>
                </tr>
              </thead>
              <tbody>
                {scenario.events.map((event) => (
                  <tr key={event.eventId}>
                    <td style={{ padding: '4px 8px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                      {event.layer}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #ddd' }}>
                      {getEventOutcome(event)}
                    </td>
                    <td style={{ padding: '4px 8px', border: '1px solid #ddd', color: '#666' }}>
                      {getEventDetail(event)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function getEventOutcome(event: AnyObservationEvent): string {
  switch (event.layer) {
    case 'decision_event': return event.decisionResult;
    case 'handoff_event': return event.handoffOutcome;
    case 'writeback_event': return event.writebackOutcome;
    case 'observation_event': return event.observationOutcome;
  }
}

function getEventDetail(event: AnyObservationEvent): string {
  switch (event.layer) {
    case 'decision_event':
      return event.hasCapabilityIssues ? `${event.issueCount} 个能力问题` : '无问题';
    case 'handoff_event':
      return event.failureReason ?? (event.handoffMethod ?? '');
    case 'writeback_event':
      return event.failureReason ?? '';
    case 'observation_event':
      return event.summary ?? event.observationType;
  }
}
