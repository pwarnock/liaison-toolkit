/**
 * Task Backend Adapter Interface
 * Abstract interface for any task backend system (Beads, GitHub, Jira, Monday, etc.)
 */

import type { Task, TaskStatus, TaskFilter, CreateTaskInput } from './types';

export interface TaskBackendAdapter {
  getTask(id: string): Promise<Task | null>;
  listTasks(filters?: TaskFilter): Promise<Task[]>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  healthCheck(): Promise<boolean>;
  name(): string;
}
