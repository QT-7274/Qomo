/**
 * B0.2 类型 contract 验证测试
 *
 * 验证 decision / writeback / observation 分层词汇的类型安全性。
 * 重点：result / action / outcome 三层分离不可混写。
 */
import { describe, it, expect } from 'vitest';
import type {
  DecisionResultType,
  LaunchDecision,
  CapabilityIssue,
  FallbackOption,
} from '../src/types/decision.types';
import type {
  WritebackOutcome,
  HandoffOutcome,
  MinimalWritebackSummary,
} from '../src/types/writeback.types';
import type {
  EventLayer,
  ObservationOutcome,
  DecisionEvent,
  HandoffEvent,
  WritebackEvent,
  ObservationEvent,
} from '../src/types/observation.types';

describe('decision.types — LaunchDecision 类型约束', () => {
  it('DecisionResultType 只包含四个合法值', () => {
    const validTypes: DecisionResultType[] = ['continue', 'cancel', 'degrade', 'substitute'];
    expect(validTypes).toHaveLength(4);
    validTypes.forEach((t) => {
      expect(typeof t).toBe('string');
    });
  });

  it('LaunchDecision 可以正确构造', () => {
    const decision: LaunchDecision = {
      decisionId: 'dec_test',
      workUnitId: 'wu_test',
      snapshotVersionId: 'ver_test',
      resultType: 'continue',
      context: {
        issues: [],
        fallbackOptions: [],
        decidedAt: '2026-03-31T00:00:00Z',
      },
    };
    expect(decision.resultType).toBe('continue');
    expect(decision.context.issues).toHaveLength(0);
  });

  it('CapabilityIssue 四种问题类型均可表达', () => {
    const types: CapabilityIssue['issueType'][] = [
      'missing', 'version_incompatible', 'permission_denied', 'ambiguous_candidate',
    ];
    expect(types).toHaveLength(4);
  });

  it('FallbackOption 两种类型均可表达', () => {
    const options: FallbackOption[] = [
      { optionType: 'degrade', description: '降级' },
      { optionType: 'substitute', description: '替代' },
    ];
    expect(options).toHaveLength(2);
  });
});

describe('writeback.types — 回写类型约束', () => {
  it('WritebackOutcome 四值独立于 DecisionResultType', () => {
    const outcomes: WritebackOutcome[] = ['success', 'partial', 'failure', 'skipped'];
    const decisionTypes: DecisionResultType[] = ['continue', 'cancel', 'degrade', 'substitute'];
    // 验证两组值无交集
    outcomes.forEach((o) => {
      expect(decisionTypes).not.toContain(o);
    });
  });

  it('HandoffOutcome 与 DecisionResultType 无交集', () => {
    const handoffOutcomes: HandoffOutcome[] = ['success', 'failure'];
    const decisionTypes: DecisionResultType[] = ['continue', 'cancel', 'degrade', 'substitute'];
    handoffOutcomes.forEach((o) => {
      expect(decisionTypes).not.toContain(o);
    });
  });

  it('MinimalWritebackSummary 可以正确构造', () => {
    const summary: MinimalWritebackSummary = {
      writebackId: 'wb_test',
      decisionId: 'dec_test',
      workUnitId: 'wu_test',
      snapshotVersionId: 'ver_test',
      decisionResult: 'continue',
      keyIssues: [],
      handoffResult: { resultType: 'copied', outcome: 'success', completedAt: '2026-03-31T00:00:00Z' },
      writebackOutcome: 'success',
      createdAt: '2026-03-31T00:00:00Z',
    };
    expect(summary.writebackOutcome).toBe('success');
    expect(summary.decisionResult).toBe('continue');
  });

  it('回写失败必须记录失败原因', () => {
    const summary: MinimalWritebackSummary = {
      writebackId: 'wb_fail',
      decisionId: 'dec_test',
      workUnitId: 'wu_test',
      snapshotVersionId: 'ver_test',
      decisionResult: 'continue',
      keyIssues: [],
      handoffResult: null,
      writebackOutcome: 'failure',
      writebackFailureReason: 'DB 写入超时',
      createdAt: '2026-03-31T00:00:00Z',
    };
    expect(summary.writebackOutcome).toBe('failure');
    expect(summary.writebackFailureReason).toBe('DB 写入超时');
  });
});

describe('observation.types — 观测事件分层约束', () => {
  it('EventLayer 四层完整', () => {
    const layers: EventLayer[] = ['decision_event', 'handoff_event', 'writeback_event', 'observation_event'];
    expect(layers).toHaveLength(4);
  });

  it('ObservationOutcome 独立于其他 outcome 类型', () => {
    const outcomes: ObservationOutcome[] = ['recorded', 'partial', 'failure', 'not_applicable'];
    expect(outcomes).toHaveLength(4);
  });

  it('DecisionEvent 绑定 decision_event 层', () => {
    const event: DecisionEvent = {
      eventId: 'evt_test',
      layer: 'decision_event',
      workUnitId: 'wu_test',
      decisionId: 'dec_test',
      timestamp: '2026-03-31T00:00:00Z',
      decisionResult: 'continue',
      hasCapabilityIssues: false,
      issueCount: 0,
    };
    expect(event.layer).toBe('decision_event');
  });

  it('HandoffEvent 绑定 handoff_event 层', () => {
    const event: HandoffEvent = {
      eventId: 'evt_test',
      layer: 'handoff_event',
      workUnitId: 'wu_test',
      decisionId: 'dec_test',
      timestamp: '2026-03-31T00:00:00Z',
      handoffOutcome: 'failure',
      failureReason: 'Clipboard 不可用',
    };
    expect(event.layer).toBe('handoff_event');
    expect(event.handoffOutcome).toBe('failure');
  });

  it('WritebackEvent 绑定 writeback_event 层', () => {
    const event: WritebackEvent = {
      eventId: 'evt_test',
      layer: 'writeback_event',
      workUnitId: 'wu_test',
      decisionId: 'dec_test',
      timestamp: '2026-03-31T00:00:00Z',
      writebackOutcome: 'failure',
      failureReason: 'IndexedDB 异常',
    };
    expect(event.layer).toBe('writeback_event');
    expect(event.writebackOutcome).toBe('failure');
  });

  it('ObservationEvent 绑定 observation_event 层', () => {
    const event: ObservationEvent = {
      eventId: 'evt_test',
      layer: 'observation_event',
      workUnitId: 'wu_test',
      decisionId: 'dec_test',
      timestamp: '2026-03-31T00:00:00Z',
      observationOutcome: 'failure',
      observationType: 'general',
      summary: '数据不完整',
    };
    expect(event.layer).toBe('observation_event');
    expect(event.observationOutcome).toBe('failure');
  });
});
