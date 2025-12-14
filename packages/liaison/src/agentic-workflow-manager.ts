/**
 * Agentic Workflow Integration
 * Connects task management with workflow automation engine
 */

import { EventEmitter } from 'events';
import chalk from 'chalk';
import type { Task, CreateTaskInput } from '../reconciler/types';

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
    
    // Simulate task creation
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: taskInput.title,
      description: taskInput.description,
      status: 'open' as any,
      createdAt: new Date(),
      priority: taskInput.priority || 'medium',
      assignedTo: taskInput.assignedTo
    };

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
}

// Export singleton instance
export const agenticWorkflowManager = new AgenticWorkflowManager();