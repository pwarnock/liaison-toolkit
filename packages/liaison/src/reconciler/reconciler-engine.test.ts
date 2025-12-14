/**
 * Reconciler Engine Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { ReconcilerEngine } from './reconciler-engine';
import type { TaskBackendAdapter } from './adapter';
import { Task, TaskStatus } from './types';

describe('ReconcilerEngine', () => {
  const createMockAdapter = (overrides?: Partial<TaskBackendAdapter>): TaskBackendAdapter => {
    return {
      getTask: vi.fn().mockResolvedValue(null),
      listTasks: vi.fn().mockResolvedValue([]),
      createTask: vi.fn().mockResolvedValue({
        id: 'new-001',
        title: 'Task',
        status: TaskStatus.Open,
        createdAt: new Date(),
      }),
      updateTaskStatus: vi.fn().mockResolvedValue({
        id: 'abc-001',
        title: 'Task',
        status: TaskStatus.Closed,
        createdAt: new Date(),
      }),
      healthCheck: vi.fn().mockResolvedValue(true),
      name: vi.fn().mockReturnValue('mock'),
      ...overrides,
    };
  };

  describe('reconcile', () => {
    it('creates task for row without ID', async () => {
      const adapter = createMockAdapter();
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: null,
          task: 'New feature',
          description: 'Implement X',
          status: 'todo' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.created).toBe(1);
      expect(result.newRows[0].id).toBe('new-001');
      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].changeType).toBe('created-id');
      expect(adapter.createTask).toHaveBeenCalled();
    });

    it('marks row done when backend task is closed', async () => {
      const closedTask: Task = {
        id: 'abc-001',
        title: 'Auth module',
        status: TaskStatus.Closed,
        createdAt: new Date(),
      };
      const adapter = createMockAdapter({
        listTasks: vi.fn().mockResolvedValue([closedTask]),
        getTask: vi.fn().mockResolvedValue(closedTask),
      });
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: 'abc-001',
          task: 'Auth module',
          status: 'todo' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.updated).toBe(1);
      expect(result.newRows[0].status).toBe('done');
      expect(result.changes[0].changeType).toBe('marked-done');
    });

    it('marks row deleted when backend task is deleted', async () => {
      const adapter = createMockAdapter({
        getTask: vi.fn().mockResolvedValue({
          id: 'abc-001',
          title: 'Auth module',
          status: TaskStatus.Deleted,
          createdAt: new Date(),
        }),
      });
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: 'abc-001',
          task: 'Auth module',
          status: 'todo' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.deleted).toBe(1);
      expect(result.newRows[0].status).toBe('deleted');
      expect(result.newRows[0].task).toContain('~~');
      expect(result.changes[0].changeType).toBe('marked-deleted');
    });

    it('marks row deleted when task not found in backend', async () => {
      const adapter = createMockAdapter({
        getTask: vi.fn().mockResolvedValue(null),
      });
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: 'abc-001',
          task: 'Auth module',
          status: 'todo' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.deleted).toBe(1);
      expect(result.newRows[0].status).toBe('deleted');
    });

    it('skips already-deleted rows', async () => {
      const adapter = createMockAdapter();
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: '~~abc-001~~',
          task: '~~Auth module~~',
          status: 'deleted' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.deleted).toBe(0);
      expect(result.changes).toHaveLength(0);
    });

    it('does not change row when task is open and row is todo', async () => {
      const openTask: Task = {
        id: 'abc-001',
        title: 'Auth module',
        status: TaskStatus.Open,
        createdAt: new Date(),
      };
      const adapter = createMockAdapter({
        listTasks: vi.fn().mockResolvedValue([openTask]),
        getTask: vi.fn().mockResolvedValue(openTask),
      });
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: 'abc-001',
          task: 'Auth module',
          status: 'todo' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.created).toBe(0);
      expect(result.updated).toBe(0);
      expect(result.deleted).toBe(0);
      expect(result.changes).toHaveLength(0);
    });

    it('handles creation errors gracefully', async () => {
      const adapter = createMockAdapter({
        createTask: vi.fn().mockRejectedValue(new Error('API error')),
      });
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        {
          id: null,
          task: 'Task',
          status: 'todo' as const,
        },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.created).toBe(0);
      expect(result.newRows[0].id).toBeNull(); // ID not inserted
    });

    it('reconciles multiple rows with mixed states', async () => {
      const closedTask: Task = {
        id: 'abc-001',
        title: 'Auth',
        status: TaskStatus.Closed,
        createdAt: new Date(),
      };
      const adapter = createMockAdapter({
        createTask: vi.fn().mockResolvedValue({
          id: 'new-001',
          title: 'Task',
          status: TaskStatus.Open,
          createdAt: new Date(),
        }),
        listTasks: vi.fn().mockResolvedValue([closedTask]), // Only abc-001 exists; abc-002 is deleted
        getTask: vi.fn((id: string) => {
          if (id === 'abc-001') {
            return Promise.resolve(closedTask);
          }
          if (id === 'abc-002') {
            return Promise.resolve(null); // Deleted
          }
          return Promise.resolve(null);
        }),
      });
      const engine = new ReconcilerEngine(adapter);

      const rows = [
        { id: null, task: 'New', status: 'todo' as const },
        { id: 'abc-001', task: 'Auth', status: 'todo' as const },
        { id: 'abc-002', task: 'Old', status: 'todo' as const },
      ];

      const result = await engine.reconcile(rows, 'v0.1.0-test');

      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.deleted).toBe(1);
      expect(result.changes).toHaveLength(3);
    });
  });
});
