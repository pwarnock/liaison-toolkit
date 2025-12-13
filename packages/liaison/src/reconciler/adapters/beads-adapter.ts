/**
 * Beads Task Backend Adapter
 * Wrapper around the bd CLI tool
 */

import { spawn } from 'child_process';
import type { Task, TaskStatus, TaskFilter, CreateTaskInput } from '../types';
import { TaskStatus as TS } from '../types';
import type { TaskBackendAdapter } from '../adapter';

interface BeadsTaskData {
  id: string;
  title: string;
  description: string;
  notes?: string;
  status: string;
  priority: number;
  issue_type: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

// Helper to spawn a command and return its output
export async function spawnPromise(
  command: string,
  args: string[],
  options: { timeoutMs?: number; cwd?: string } = {}
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    child.on('error', (err) => {
      reject(err);
    });

    // Add timeout if specified
    if (options.timeoutMs) {
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error('Command timeout'));
      }, options.timeoutMs);

      child.on('close', () => clearTimeout(timeout));
    }
  });
}

export class BeadsAdapter implements TaskBackendAdapter {
  private commandPrefix: string[] = [];

  constructor(useBunX: boolean = false) {
    this.commandPrefix = useBunX ? ['bun', 'x', 'bd'] : ['bd'];
  }

  async getTask(id: string): Promise<Task | null> {
    try {
      const { stdout } = await spawnPromise(this.commandPrefix[0], [
        ...this.commandPrefix.slice(1),
        'list',
        `--id=${id}`,
        '--json',
      ]);
      const tasks: Array<Record<string, unknown>> = JSON.parse(stdout);
      if (tasks.length === 0) return null;
      return this.parseTask(tasks[0] as unknown as BeadsTaskData);
    } catch (err) {
      console.error(`BeadsAdapter.getTask(${id}):`, err);
      return null;
    }
  }

  async listTasks(filters?: TaskFilter): Promise<Task[]> {
    try {
      const args = ['list', '--json'];
      if (filters?.status) {
        args.push(`--status=${filters.status}`);
      }
      if (filters?.assignedTo) {
        args.push(`--assigned-to=${filters.assignedTo}`);
      }

      const { stdout } = await spawnPromise(
        this.commandPrefix[0],
        [...this.commandPrefix.slice(1), ...args],
        { timeoutMs: 10000 }
      );
      const tasks: Array<Record<string, unknown>> = JSON.parse(stdout);
      return tasks.map((t) => this.parseTask(t as unknown as BeadsTaskData));
    } catch (err) {
      console.error('BeadsAdapter.listTasks():', err);
      return [];
    }
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    try {
      const args = ['create', `--title=${input.title}`];
      if (input.description) {
        args.push(`--description=${input.description}`);
      }
      if (input.assignedTo) {
        args.push(`--assigned-to=${input.assignedTo}`);
      }
      args.push('--json');

      const { stdout } = await spawnPromise(this.commandPrefix[0], [
        ...this.commandPrefix.slice(1),
        ...args,
      ]);
      const task = JSON.parse(stdout);
      return this.parseTask(task as unknown as BeadsTaskData);
    } catch (err) {
      throw new Error(`Failed to create task: ${err}`);
    }
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    try {
      const { stdout } = await spawnPromise(this.commandPrefix[0], [
        ...this.commandPrefix.slice(1),
        'update',
        id,
        `--status=${status}`,
        '--json',
      ]);
      const tasks = JSON.parse(stdout);
      // bd returns array for update command
      if (Array.isArray(tasks) && tasks.length > 0) {
        return this.parseTask(tasks[0] as unknown as BeadsTaskData);
      }
      return this.parseTask(tasks as unknown as BeadsTaskData);
    } catch (err) {
      throw new Error(`Failed to update task: ${err}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { stdout } = await spawnPromise(
        this.commandPrefix[0],
        [...this.commandPrefix.slice(1), '--version'],
        { timeoutMs: 5000 }
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  name(): string {
    return 'beads';
  }

  private parseTask(data: BeadsTaskData): Task {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: this.parseStatus(data.status),
      createdAt: new Date(data.created_at),
      closedAt: data.closed_at ? new Date(data.closed_at) : undefined,
    };
  }

  private parseStatus(status: string): TaskStatus {
    if (!status) return TS.Open;
    const normalized = status.toLowerCase();
    if (normalized === 'closed' || normalized === 'done') {
      return TS.Closed;
    }
    if (normalized === 'deleted') {
      return TS.Deleted;
    }
    return TS.Open;
  }
}
