/**
 * Agentic Workflow Integration
 * Connects task management with workflow automation engine
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';
import { BeadsAdapter } from './reconciler/adapters/beads-adapter';
import type { Task, CreateTaskInput } from './reconciler/types';
import { TaskStatus } from './reconciler/types';
import { spawn } from 'child_process';
import { writeFileSync, appendFileSync } from 'fs';

export interface TaskEvent {
  type: 'created' | 'updated' | 'closed';
  taskId: string;
  task: Task;
  timestamp: Date;
  metadata?: any;
}

export interface WorkflowTrigger {
  condition: (task: Task) => boolean;
  workflowId: string;
  description: string;
  priority: number;
}

export class AgenticWorkflowManager extends EventEmitter {
  private triggers: Map<string, WorkflowTrigger[]> = new Map();
  private eventHistory: TaskEvent[] = [];

  constructor() {
    super();
    this.setupDefaultTriggers();
    this.setupWorkflowCompletionListener();
  }

  /**
   * Register a workflow trigger for task events
   */
  registerTrigger(eventType: string, trigger: WorkflowTrigger): void {
    if (!this.triggers.has(eventType)) {
      this.triggers.set(eventType, []);
    }
    this.triggers.get(eventType)!.push(trigger);
    
    console.log(chalk.blue(`🎯 Registered trigger: ${trigger.description} for ${eventType}`));
  }

  /**
   * Process task event and trigger matching workflows
   */
  async processTaskEvent(event: TaskEvent): Promise<string[]> {
    const triggeredWorkflows: string[] = [];
    
    // Store event in history
    this.eventHistory.push(event);
    
    // Get triggers for this event type
    const triggers = this.triggers.get(event.type) || [];
    
    console.log(chalk.blue(`🔄 Processing ${event.type} event for task ${event.taskId}`));
    
    // Evaluate each trigger
    for (const trigger of triggers) {
      if (trigger.condition(event.task)) {
        console.log(chalk.green(`🚀 Trigger matched: ${trigger.description}`));
        console.log(chalk.yellow(`⚡ Would execute workflow: ${trigger.workflowId}`));
        
        // Emit workflow trigger event
        this.emit('workflow.trigger', {
          workflowId: trigger.workflowId,
          task: event.task,
          trigger: trigger.description,
          timestamp: new Date()
        });
        
        triggeredWorkflows.push(trigger.workflowId);
      }
    }
    
    return triggeredWorkflows;
  }

  /**
   * Create task with automatic workflow triggering
   */
  async createTaskWithTriggers(taskInput: CreateTaskInput): Promise<Task> {
    // This would integrate with the actual task creation system
    console.log(chalk.blue(`🔧 Creating task: ${taskInput.title}`));
    
    try {
      const adapter = new BeadsAdapter(true);
      
      // Create actual task in backend
      const task = await adapter.createTask(taskInput);

      // Emit task creation event
      const event: TaskEvent = {
        type: 'created',
        taskId: task.id,
        task,
        timestamp: new Date(),
        metadata: {
          autoTrigger: taskInput.priority === 'high' || taskInput.priority === 'critical'
        }
      };

      // Process triggers
      const triggeredWorkflows = await this.processTaskEvent(event);
      
      if (triggeredWorkflows.length > 0) {
        console.log(chalk.green(`✨ Task created with ${triggeredWorkflows.length} auto-triggered workflows`));
      }

      return task;
    } catch (error) {
      console.error(chalk.red(`Failed to create task: ${error}`));
      throw error;
    }
  }

  /**
   * Create subtasks from workflow execution
   */
  async createSubtasks(parentTaskId: string, subtaskDefinitions: Array<{
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    workflowTrigger?: string;
  }>): Promise<Task[]> {
    console.log(chalk.blue(`🔧 Creating ${subtaskDefinitions.length} subtasks for parent ${parentTaskId}`));
    
    try {
      const adapter = new BeadsAdapter(true);
      const createdTasks: Task[] = [];

      for (const subtaskDef of subtaskDefinitions) {
        const task = await adapter.createTask({
          title: subtaskDef.title,
          description: subtaskDef.description,
          priority: subtaskDef.priority || 'medium'
        });

        createdTasks.push(task);

        // Emit task creation event to trigger additional workflows
        if (subtaskDef.workflowTrigger) {
          const event: TaskEvent = {
            type: 'created',
            taskId: task.id,
            task,
            timestamp: new Date(),
            metadata: {
              parentTaskId,
              workflowTrigger: subtaskDef.workflowTrigger
            }
          };

          await this.processTaskEvent(event);
        }
      }

      console.log(chalk.green(`✅ Created ${createdTasks.length} subtasks`));
      return createdTasks;
    } catch (error) {
      console.error(chalk.red(`Failed to create subtasks: ${error}`));
      throw error;
    }
  }

  /**
   * Update task status from workflow completion
   */
  async updateTaskFromWorkflow(taskId: string, status: TaskStatus, workflowId: string): Promise<Task> {
    console.log(chalk.blue(`🔄 Updating task ${taskId} from workflow ${workflowId}`));
    
    try {
      const adapter = new BeadsAdapter(true);
      const task = await adapter.updateTaskStatus(taskId, status);

      // Emit task update event
      const event: TaskEvent = {
        type: 'updated',
        taskId: task.id,
        task,
        timestamp: new Date(),
        metadata: {
          workflowId,
          previousStatus: 'open' // This would be tracked properly
        }
      };

      await this.processTaskEvent(event);
      
      console.log(chalk.green(`✅ Task ${taskId} updated to ${status}`));
      return task;
    } catch (error) {
      console.error(chalk.red(`Failed to update task: ${error}`));
      throw error;
    }
  }

  /**
   * Get trigger statistics
   */
  getTriggerStats(): any {
    const stats = {
      totalTriggers: 0,
      triggersByType: {} as Record<string, number>,
      recentEvents: this.eventHistory.slice(-10)
    };

    for (const [eventType, triggers] of this.triggers) {
      stats.triggersByType[eventType] = triggers.length;
      stats.totalTriggers += triggers.length;
    }

    return stats;
  }

  /**
   * Setup default workflow triggers
   */
  private setupDefaultTriggers(): void {
    // Security tasks trigger
    this.registerTrigger('created', {
      condition: (task) => 
        task.title.toLowerCase().includes('security') ||
        task.title.toLowerCase().includes('critical') ||
        task.priority === 'critical',
      workflowId: 'security-response',
      description: 'Security/critical task detected',
      priority: 1
    });

    // Bug tasks trigger
    this.registerTrigger('created', {
      condition: (task) => 
        task.title.toLowerCase().includes('bug') &&
        (task.title.toLowerCase().includes('production') || task.priority === 'high'),
      workflowId: 'bug-fix',
      description: 'Production bug detected',
      priority: 2
    });

    // High priority tasks trigger
    this.registerTrigger('created', {
      condition: (task) => task.priority === 'high' || task.priority === 'critical',
      workflowId: 'high-priority-response',
      description: 'High priority task detected',
      priority: 3
    });

    // Documentation tasks trigger
    this.registerTrigger('created', {
      condition: (task) => 
        task.title.toLowerCase().includes('doc') ||
        task.title.toLowerCase().includes('readme') ||
        task.title.toLowerCase().includes('guide'),
      workflowId: 'documentation-update',
      description: 'Documentation task detected',
      priority: 4
    });

    console.log(chalk.green(`✅ Setup ${this.triggers.size} default workflow triggers`));
  }

  /**
   * Setup listener for workflow completion events
   */
  private setupWorkflowCompletionListener(): void {
    this.on('workflow.executed', async (event: any) => {
      if (!event.dryRun && event.taskId) {
        console.log(chalk.blue(`🔄 Workflow ${event.workflowId} completed for task ${event.taskId}`));
        
        // Check if all subtasks are completed, then commit changes
        try {
          const adapter = new BeadsAdapter(true);
          const tasks = await adapter.listTasks({ status: TaskStatus.Open });
          
          // Filter tasks related to this workflow
          const relatedTasks = tasks.filter(task => 
            task.id === event.taskId || 
            task.title.toLowerCase().includes(event.workflowId.toLowerCase())
          );

          // If all related tasks are closed, commit changes
          const allClosed = relatedTasks.every(task => task.status === TaskStatus.Closed);
          
          if (allClosed && relatedTasks.length > 0) {
            console.log(chalk.green(`✅ All tasks for workflow ${event.workflowId} completed - committing changes`));
            await this.commitWorkflowChanges(event.workflowId, event.taskId);
          }
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Failed to check task completion status: ${error}`));
        }
      }
    });
  }

  /**
   * Commit changes after workflow completion
   */
  private async commitWorkflowChanges(workflowId: string, taskId: string): Promise<void> {
    try {
      console.log(chalk.blue(`🔧 Committing changes for workflow ${workflowId}`));
      
      // Create commit message
      const commitMessage = `feat: Complete ${workflowId} workflow automation\n\n- Task ID: ${taskId}\n- Workflow: ${workflowId}\n- Auto-generated commit from workflow completion\n\nThis commit was automatically created when the workflow completed successfully.`;

      // Add changes to git
      await this.executeGitCommand(['add', '.']);
      
      // Commit changes
      await this.executeGitCommand(['commit', '-m', commitMessage]);
      
      console.log(chalk.green(`✅ Changes committed for workflow ${workflowId}`));
      
      // Log the commit
      this.logWorkflowCommit(workflowId, taskId, commitMessage);
      
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to commit workflow changes: ${error}`));
    }
  }

  /**
   * Execute git command
   */
  private executeGitCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('git', args, {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      childProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString();
      });

      childProcess.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });

      childProcess.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Git command failed with code ${code}: ${errorOutput}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to execute git command: ${error.message}`));
      });
    });
  }

  /**
   * Log workflow commit for tracking
   */
  private logWorkflowCommit(workflowId: string, taskId: string, commitMessage: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      workflowId,
      taskId,
      commitMessage,
      type: 'workflow-commit'
    };

    try {
      appendFileSync('logs/workflow-commits.jsonl', JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Failed to log workflow commit: ${error}`));
    }
  }
}

// Export singleton instance
export const agenticWorkflowManager = new AgenticWorkflowManager();