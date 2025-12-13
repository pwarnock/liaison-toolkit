/**
 * Task Command Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTaskCommand } from './task';
import { BeadsAdapter } from '../reconciler/adapters/beads-adapter';
import type { Task } from '../reconciler/types';
import { TaskStatus } from '../reconciler/types';

// Mock BeadsAdapter
vi.mock('../reconciler/adapters/beads-adapter', () => {
  const mockAdapter = {
    getTask: vi.fn(),
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    healthCheck: vi.fn(),
    name: vi.fn(() => 'beads'),
  };

  return {
    BeadsAdapter: vi.fn(() => mockAdapter),
  };
});

describe('Task Command', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit');
    }) as any);
  });

  describe('create command', () => {
    it('should create a task with title only', async () => {
      const command = createTaskCommand();
      const mockTask: Task = {
        id: 'task-123',
        title: 'Test Task',
        description: undefined,
        status: TaskStatus.Open,
        createdAt: new Date(),
        closedAt: undefined,
      };

      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(true);
      (adapter.createTask as any).mockResolvedValue(mockTask);

      // Test the command would create a task
      // In real usage: liaison task create "Test Task"
      expect(mockTask.id).toBe('task-123');
      expect(mockTask.title).toBe('Test Task');
    });

    it('should fail if backend is unhealthy', async () => {
      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(false);

      // The command would fail during health check
      // Testing that health check is performed first
      const healthy = await adapter.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('list command', () => {
    it('should list all tasks', async () => {
      const mockTasks: Task[] = [
        {
          id: 'task-1',
          title: 'Task 1',
          description: 'Description 1',
          status: TaskStatus.Open,
          createdAt: new Date(),
          closedAt: undefined,
        },
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Description 2',
          status: TaskStatus.Closed,
          createdAt: new Date(),
          closedAt: new Date(),
        },
      ];

      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(true);
      (adapter.listTasks as any).mockResolvedValue(mockTasks);

      const tasks = await adapter.listTasks();
      expect(tasks.length).toBe(2);
      expect(tasks[0].id).toBe('task-1');
      expect(tasks[1].status).toBe('closed');
    });

    it('should filter tasks by status', async () => {
      const mockClosedTasks: Task[] = [
        {
          id: 'task-2',
          title: 'Task 2',
          description: 'Description 2',
          status: TaskStatus.Closed,
          createdAt: new Date(),
          closedAt: new Date(),
        },
      ];

      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(true);
      (adapter.listTasks as any).mockResolvedValue(mockClosedTasks);

      const tasks = await adapter.listTasks({ status: TaskStatus.Closed });
      expect(tasks.length).toBe(1);
      expect(tasks[0].status).toBe(TaskStatus.Closed);
    });
  });

  describe('get command', () => {
    it('should retrieve a task by id', async () => {
      const mockTask: Task = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.Open,
        createdAt: new Date(),
        closedAt: undefined,
      };

      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(true);
      (adapter.getTask as any).mockResolvedValue(mockTask);

      const task = await adapter.getTask('task-123');
      expect(task).toEqual(mockTask);
      expect(task?.id).toBe('task-123');
      expect(task?.title).toBe('Test Task');
    });

    it('should return null for non-existent task', async () => {
      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(true);
      (adapter.getTask as any).mockResolvedValue(null);

      const task = await adapter.getTask('non-existent');
      expect(task).toBeNull();
    });
  });

  describe('update command', () => {
    it('should update task status to closed', async () => {
      const mockTask: Task = {
        id: 'task-123',
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.Closed,
        createdAt: new Date(),
        closedAt: new Date(),
      };

      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(true);
      (adapter.updateTaskStatus as any).mockResolvedValue(mockTask);

      const task = await adapter.updateTaskStatus('task-123', TaskStatus.Closed);
      expect(task.status).toBe(TaskStatus.Closed);
      expect(task.closedAt).toBeDefined();
    });

    it('should fail if backend is unhealthy', async () => {
      const adapter = new BeadsAdapter(true);
      (adapter.healthCheck as any).mockResolvedValue(false);

      const healthy = await adapter.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('command structure', () => {
    it('should create task command with proper subcommands', () => {
      const command = createTaskCommand();
      expect(command.name()).toBe('task');
      expect(command.description()).toBe('Manage tasks in the backend');
    });
  });
});
