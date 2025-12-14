/**
 * File System Watcher
 * Monitors file system changes and triggers workflows
 */

import { EventEmitter } from 'events';
import { watch, FSWatcher } from 'fs';
import { spawn } from 'child_process';
import chalk from 'chalk';
import { AgenticWorkflowManager } from './agentic-workflow-manager';

export interface FileSystemEvent {
  type: 'git-commit' | 'file-modified' | 'file-created' | 'file-deleted';
  path: string;
  timestamp: Date;
  metadata?: any;
}

export interface FileSystemTrigger {
  condition: (event: FileSystemEvent) => boolean;
  workflowId: string;
  description: string;
  priority: number;
}

export class FileSystemWatcher extends EventEmitter {
  private triggers: Map<string, FileSystemTrigger[]> = new Map();
  private watchers: Map<string, FSWatcher> = new Map();
  private eventHistory: FileSystemEvent[] = [];
  private lastGitCommit: string = '';
  private workflowManager: AgenticWorkflowManager;

  constructor(workflowManager: AgenticWorkflowManager) {
    super();
    this.workflowManager = workflowManager;
    this.setupDefaultTriggers();
    this.startGitMonitoring();
  }

  /**
   * Register a file system trigger
   */
  registerTrigger(eventType: string, trigger: FileSystemTrigger): void {
    if (!this.triggers.has(eventType)) {
      this.triggers.set(eventType, []);
    }
    this.triggers.get(eventType)!.push(trigger);
    
    console.log(chalk.blue(`📁 Registered file system trigger: ${trigger.description} for ${eventType}`));
  }

  /**
   * Start watching a directory for file changes
   */
  startWatching(path: string): void {
    if (this.watchers.has(path)) {
      console.log(chalk.yellow(`⚠️  Already watching ${path}`));
      return;
    }

    console.log(chalk.blue(`📁 Starting to watch ${path}`));
    
    const watcher = watch(path, { recursive: true }, (eventType, filename) => {
      if (filename) {
        this.handleFileChange(eventType, filename, path);
      }
    });

    this.watchers.set(path, watcher);
  }

  /**
   * Stop watching a directory
   */
  stopWatching(path: string): void {
    const watcher = this.watchers.get(path);
    if (watcher) {
      watcher.close();
      this.watchers.delete(path);
      console.log(chalk.blue(`📁 Stopped watching ${path}`));
    }
  }

  /**
   * Handle file system changes
   */
  private handleFileChange(eventType: string, filename: string, path: string): void {
    const fullPath = `${path}/${filename}`;
    const event: FileSystemEvent = {
      type: eventType === 'rename' ? 'file-deleted' : 'file-modified',
      path: fullPath,
      timestamp: new Date(),
      metadata: {
        eventType,
        filename,
        directory: path
      }
    };

    this.processFileSystemEvent(event);
  }

  /**
   * Process file system event and trigger matching workflows
   */
  async processFileSystemEvent(event: FileSystemEvent): Promise<string[]> {
    const triggeredWorkflows: string[] = [];
    
    // Store event in history
    this.eventHistory.push(event);
    
    console.log(chalk.blue(`📁 Processing ${event.type} event: ${event.path}`));
    
    // Get triggers for this event type
    const triggers = this.triggers.get(event.type) || [];
    
    // Evaluate each trigger
    for (const trigger of triggers) {
      if (trigger.condition(event)) {
        console.log(chalk.green(`🚀 File system trigger matched: ${trigger.description}`));
        
        // Create task from file system event
        const task = await this.createTaskFromFileSystemEvent(event, trigger.workflowId);
        
        // Emit workflow trigger event
        this.emit('filesystem.workflow.trigger', {
          workflowId: trigger.workflowId,
          event,
          task,
          trigger: trigger.description,
          timestamp: new Date()
        });
        
        triggeredWorkflows.push(trigger.workflowId);
      }
    }
    
    return triggeredWorkflows;
  }

  /**
   * Create task from file system event
   */
  private async createTaskFromFileSystemEvent(event: FileSystemEvent, workflowId: string): Promise<any> {
    const taskTitle = this.generateTaskTitle(event, workflowId);
    const taskDescription = this.generateTaskDescription(event, workflowId);
    
    // Determine priority based on event type and path
    const priority = this.determinePriority(event);
    
    try {
      const task = await this.workflowManager.createTaskWithTriggers({
        title: taskTitle,
        description: taskDescription,
        priority
      });

      console.log(chalk.green(`✅ Created task from file system event: ${taskTitle}`));
      return task;
    } catch (error) {
      console.error(chalk.red(`Failed to create task from file system event: ${error}`));
      throw error;
    }
  }

  /**
   * Generate task title from file system event
   */
  private generateTaskTitle(event: FileSystemEvent, _workflowId: string): string {
    const filename = event.path.split('/').pop() || event.path;
    
    switch (event.type) {
      case 'git-commit':
        return `Git commit detected: ${event.metadata?.commitMessage || 'Unknown commit'}`;
      case 'file-modified':
        return `File modified: ${filename}`;
      case 'file-created':
        return `File created: ${filename}`;
      case 'file-deleted':
        return `File deleted: ${filename}`;
      default:
        return `File system change: ${filename}`;
    }
  }

  /**
   * Generate task description from file system event
   */
  private generateTaskDescription(event: FileSystemEvent, workflowId: string): string {
    return `Automatically created task from file system event:\n\n- Event Type: ${event.type}\n- Path: ${event.path}\n- Timestamp: ${event.timestamp.toISOString()}\n- Workflow: ${workflowId}\n\nThis task was automatically triggered by a file system change.`;
  }

  /**
   * Determine priority based on event type and path
   */
  private determinePriority(event: FileSystemEvent): 'low' | 'medium' | 'high' | 'critical' {
    // High priority for source code changes
    if (event.path.includes('/src/') || event.path.includes('/packages/')) {
      return 'high';
    }
    
    // Critical for configuration changes
    if (event.path.includes('/config/') || event.path.includes('package.json') || event.path.includes('tsconfig.json')) {
      return 'critical';
    }
    
    // Medium priority for documentation
    if (event.path.includes('/docs/') || event.path.includes('.md')) {
      return 'medium';
    }
    
    // Low priority for everything else
    return 'low';
  }

  /**
   * Start monitoring git commits
   */
  private startGitMonitoring(): void {
    console.log(chalk.blue(`🔧 Starting git commit monitoring`));
    
    // Check git status every 5 seconds
    setInterval(async () => {
      try {
        const currentCommit = await this.getCurrentGitCommit();
        
        if (this.lastGitCommit && currentCommit !== this.lastGitCommit) {
          // New commit detected
          const commitInfo = await this.getCommitInfo(currentCommit);
          
          const event: FileSystemEvent = {
            type: 'git-commit',
            path: process.cwd(),
            timestamp: new Date(),
            metadata: {
              commitHash: currentCommit,
              commitMessage: commitInfo.message,
              author: commitInfo.author,
              previousCommit: this.lastGitCommit
            }
          };

          this.lastGitCommit = currentCommit;
          await this.processFileSystemEvent(event);
        } else if (!this.lastGitCommit) {
          this.lastGitCommit = currentCommit;
        }
      } catch (error) {
        // Not in a git repository or git command failed
        console.warn(chalk.yellow(`⚠️  Git monitoring error: ${error}`));
      }
    }, 5000);
  }

  /**
   * Get current git commit hash
   */
  private async getCurrentGitCommit(): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('git', ['rev-parse', 'HEAD'], {
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
          resolve(output.trim());
        } else {
          reject(new Error(`Git command failed: ${errorOutput}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to execute git command: ${error.message}`));
      });
    });
  }

  /**
   * Get commit information
   */
  private async getCommitInfo(commitHash: string): Promise<{ message: string; author: string }> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('git', ['log', '-1', '--pretty=%B|%an', commitHash], {
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
          const [message, author] = output.trim().split('|');
          resolve({ message, author });
        } else {
          reject(new Error(`Git log command failed: ${errorOutput}`));
        }
      });

      childProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to execute git log command: ${error.message}`));
      });
    });
  }

  /**
   * Setup default file system triggers
   */
  private setupDefaultTriggers(): void {
    // Git commit trigger
    this.registerTrigger('git-commit', {
      condition: (event) => event.type === 'git-commit',
      workflowId: 'git-commit-response',
      description: 'Git commit detected',
      priority: 1
    });

    // Source code modification trigger
    this.registerTrigger('file-modified', {
      condition: (event) => 
        event.path.includes('/src/') || 
        event.path.includes('/packages/') ||
        event.path.endsWith('.ts') ||
        event.path.endsWith('.js') ||
        event.path.endsWith('.tsx') ||
        event.path.endsWith('.jsx'),
      workflowId: 'code-change-response',
      description: 'Source code modified',
      priority: 2
    });

    // Configuration change trigger
    this.registerTrigger('file-modified', {
      condition: (event) => 
        event.path.includes('/config/') ||
        event.path.includes('package.json') ||
        event.path.includes('tsconfig.json') ||
        event.path.includes('.yaml') ||
        event.path.includes('.yml'),
      workflowId: 'config-change-response',
      description: 'Configuration file modified',
      priority: 1
    });

    // Documentation change trigger
    this.registerTrigger('file-modified', {
      condition: (event) => 
        event.path.includes('/docs/') ||
        event.path.endsWith('.md') ||
        event.path.includes('README'),
      workflowId: 'documentation-update',
      description: 'Documentation modified',
      priority: 3
    });

    console.log(chalk.green(`✅ Setup ${this.triggers.size} default file system triggers`));
  }

  /**
   * Get file system watcher statistics
   */
  getWatcherStats(): any {
    const stats = {
      totalTriggers: 0,
      triggersByType: {} as Record<string, number>,
      activeWatchers: this.watchers.size,
      watchedPaths: Array.from(this.watchers.keys()),
      recentEvents: this.eventHistory.slice(-10),
      lastGitCommit: this.lastGitCommit
    };

    for (const [eventType, triggers] of this.triggers) {
      stats.triggersByType[eventType] = triggers.length;
      stats.totalTriggers += triggers.length;
    }

    return stats;
  }

  /**
   * Stop all file system watchers
   */
  stopAll(): void {
    for (const [, watcher] of this.watchers) {
      watcher.close();
    }
    this.watchers.clear();
    console.log(chalk.blue(`📁 Stopped all file system watchers`));
  }
}

// Export singleton instance
export let fileSystemWatcher: FileSystemWatcher;

// Initialize with workflow manager when available
export function initializeFileSystemWatcher(workflowManager: AgenticWorkflowManager): FileSystemWatcher {
  if (!fileSystemWatcher) {
    fileSystemWatcher = new FileSystemWatcher(workflowManager);
  }
  return fileSystemWatcher;
}