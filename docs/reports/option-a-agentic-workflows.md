# Option A: Agentic Task-Driven Workflows - Implementation Plan

**Date**: 2025-12-14
**Priority**: HIGH
**Status**: PLANNED

## Executive Summary
Option A addresses the critical gap between Liaison's powerful task management system and its comprehensive workflow automation engine. Currently, these systems operate independently, requiring manual intervention to connect them.

## Current State Analysis

### ✅ What We Have
1. **Task Management**: Full CRUD operations with `liaison task` commands
2. **Workflow Engine**: Extensive automation capabilities in `liaison workflow` commands
3. **Git Hooks**: Pre-commit automation for quality checks
4. **Plugin Architecture**: Extensible system for custom workflows

### ❌ What's Missing
1. **Task-Driven Triggers**: No automatic workflow execution when tasks are created/updated
2. **Smart Assignment**: No automatic task assignment to agents
3. **Closed Loop**: Tasks don't automatically create workflows that create more tasks
4. **Intelligent Automation**: No conditional workflows based on task status/priority

## Option A Implementation Plan

### Phase 1: Task-Driven Workflow Triggers

**Task**: owk-8ik - Implement Agentic Task-Driven Workflows

**Implementation Steps**:
1. **Extend Task Events**: Add event emission when tasks are created/updated
2. **Workflow Triggers**: Create `--trigger task-created` and `--trigger task-updated` options
3. **Automatic Execution**: Hook task events to workflow engine
4. **Status Integration**: Update task status based on workflow progress

**Expected Commands**:
```bash
# Create task that automatically triggers workflow
liaison task create "Fix critical bug" \
  --auto-trigger "bug-fix-workflow" \
  --priority high \
  --auto-assign security-team

# Workflow that runs when high-priority tasks are created
liaison workflow create "high-priority-response" \
  --trigger "task-created:priority=high" \
  --actions "assign-security-team,create-subtasks,notify-stakeholders"
```

### Phase 2: Smart Task Assignment

**Task**: owk-447 - Add Agentic Workflow Guidelines to AGENTS.md

**Implementation Steps**:
1. **Agent Availability**: Track which agents are available for work
2. **Skill Matching**: Match task requirements to agent capabilities
3. **Load Balancing**: Distribute tasks based on current workload
4. **Auto-Assignment Rules**: Define when tasks should be auto-assigned

**Guidelines to Add**:
- When to use auto-assignment vs manual assignment
- How to define agent capabilities and availability
- Rules for task prioritization and distribution
- Integration patterns with existing workflow system

### Phase 3: Demonstration Workflow

**Task**: owk-wtfz - Demonstrate Agentic Workflow Integration

**Implementation Steps**:
1. **Create Example Workflow**: Task creation → auto-assignment → progress tracking
2. **Closed Loop Demo**: Show workflow creating subtasks automatically
3. **Status Updates**: Demonstrate automatic task status updates
4. **Performance Metrics**: Track efficiency gains from automation

**Example Workflow**:
```bash
# When any task is created with "security" tag
liaison workflow create "security-task-handler" \
  --trigger "task-created:tag=security" \
  --actions "auto-assign-security-team,create-security-checklist,notify-security-lead" \
  --schedule "0 9 * * 1-5"
```

## Technical Implementation Details

### 1. Event System Enhancement

**File**: `packages/liaison/src/events/task-events.ts`
```typescript
export interface TaskEvent {
  type: 'created' | 'updated' | 'closed';
  taskId: string;
  data: any;
  timestamp: Date;
}

export class TaskEventEmitter {
  emit(event: TaskEvent): void;
  onTrigger(trigger: string, callback: (event: TaskEvent) => void): void;
}
```

### 2. Workflow Integration

**File**: `packages/liaison/src/workflow/task-driven-workflows.ts`
```typescript
export class TaskDrivenWorkflow {
  constructor(
    private taskManager: TaskManager,
    private workflowEngine: WorkflowEngine
  ) {}
  
  setupTriggers(): void {
    // Auto-trigger workflows based on task events
    this.taskManager.on('created', this.handleTaskCreated.bind(this));
    this.taskManager.on('updated', this.handleTaskUpdated.bind(this));
  }
  
  private handleTaskCreated(event: TaskEvent): void {
    // Check for auto-trigger conditions
    if (this.shouldAutoTrigger(event.data)) {
      this.workflowEngine.execute(this.getMatchingWorkflow(event.data));
    }
  }
}
```

### 3. Smart Assignment Logic

**File**: `packages/liaison/src/assignment/auto-assigner.ts`
```typescript
export interface AgentCapability {
  agentId: string;
  skills: string[];
  availability: 'available' | 'busy' | 'offline';
  currentLoad: number;
  maxCapacity: number;
}

export class AutoAssigner {
  assignTask(task: Task): AgentCapability | null {
    // Find best match based on skills, availability, and load
    return this.findBestAgent(task);
  }
}
```

## Integration Points

### 1. CLI Command Extensions

**New Commands**:
```bash
# Task with auto-trigger
liaison task create "Title" --auto-trigger "workflow-name"

# Workflow with task triggers
liaison workflow create "name" --trigger "task-created:priority=high"

# Agent availability management
liaison agent status --agent-id "agent-1" --status "available"
```

### 2. Configuration Management

**File**: `config/agentic-workflows.json`
```json
{
  "autoTriggers": {
    "enabled": true,
    "rules": [
      {
        "condition": "task.priority === 'high'",
        "workflow": "high-priority-response",
        "autoAssign": true
      }
    ]
  },
  "assignment": {
    "enabled": true,
    "strategy": "skill-match-load-balance",
    "rules": {
      "maxTasksPerAgent": 3,
      "skillThreshold": 0.8
    }
  }
}
```

## Expected Benefits

### 1. Closed-Loop Automation
- Tasks create workflows
- Workflows create and manage tasks
- System becomes self-optimizing

### 2. Proactive Management
- High-priority tasks automatically get attention
- Agents get assigned work without manual intervention
- Stakeholders get notified automatically

### 3. Scalable Operations
- Complex workflows can be built without manual setup
- Multiple agents can work in parallel
- System adapts to workload changes

### 4. Improved Efficiency
- Reduced manual task assignment overhead
- Faster response to critical issues
- Better resource utilization

## Success Metrics

### Phase 1 Success Criteria
- [ ] Task events trigger workflows automatically
- [ ] Workflow can access task context
- [ ] Task status updates based on workflow progress
- [ ] Integration tests pass

### Phase 2 Success Criteria
- [ ] Auto-assignment rules documented in AGENTS.md
- [ ] Agent capability tracking implemented
- [ ] Load balancing working correctly
- [ ] Manual override available when needed

### Phase 3 Success Criteria
- [ ] Complete demo workflow implemented
- [ ] Closed-loop demonstrated
- [ ] Performance metrics collected
- [ ] Documentation updated with examples

## Risk Mitigation

### 1. Infinite Loop Prevention
- Add safeguards to prevent workflow cascades
- Implement maximum depth limits
- Require manual approval for recursive triggers

### 2. Manual Override
- Always allow manual task assignment
- Provide emergency stop mechanisms
- Maintain audit trail of all automated actions

### 3. Gradual Rollout
- Start with low-risk workflows
- Monitor performance before expanding
- Keep manual fallback available

## Next Steps

1. **Execute owk-8ik**: Implement core task-driven workflow integration
2. **Execute owk-447**: Update AGENTS.md with agentic guidelines
3. **Execute owk-wtfz**: Create demonstration workflow
4. **Validate**: Test complete closed-loop system
5. **Iterate**: Refine based on performance metrics

This implementation will transform Liaison from a manual task management tool into an intelligent, self-optimizing system that truly embodies agentic workflow automation.