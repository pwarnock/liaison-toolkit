# Task-Driven CLI Workflow System

## Overview

The Task-Driven CLI Workflow System is a comprehensive automation platform that integrates with the Beads task management system to provide intelligent, dependency-aware workflow automation. This system enables seamless orchestration between strategy (Beads issues) and execution (automated workflows).

## Architecture

### Core Components

#### 1. Workflow Patterns
The system implements three core workflow patterns based on Beads DAG dependency analysis:

**Foundation Pattern (owk-ghc style)**
- **Structure**: 1 foundation task blocks 7 dependent tasks
- **Use Case**: Testing strategy implementation, infrastructure setup
- **Example**: Creating a testing framework that blocks 7 testing-related tasks

**Sequential Pattern (owk-12 → owk-11 style)**
- **Structure**: Linear dependency chains (Planning → Implementation → Release)
- **Use Case**: Release pipelines, phased deployments
- **Example**: Plan v0.3.0 → Tag and release v0.2.0 → subsequent tasks

**Discovery Pattern (owk-43 style)**
- **Structure**: Core work discovers 6 related tasks during execution
- **Use Case**: Research projects, exploratory development
- **Example**: Git automation Phase 2 discovers 6 additional tasks

#### 2. CLI Command Structure

```bash
liaison workflow <command> [options]
```

**Available Commands:**
- `list` - List all available workflows
- `create <name>` - Create new workflow with triggers and actions
- `run <name>` - Execute workflow with optional task association
- `watch <path>` - Monitor file system paths for changes
- `status` - Check workflow execution status
- `triggers` - View trigger configuration and statistics
- `schedule <name> <time>` - Schedule workflow execution
- `logs <name>` - View workflow execution logs

### Integration Points

#### Beads DAG Integration
- **Dependency Analysis**: Automatically analyzes Beads task relationships
- **Blocking Relationships**: Respects "blocks" dependencies in task execution
- **Sequential Chains**: Executes tasks in dependency order
- **Discovery Tracking**: Automatically tracks discovered tasks

#### Agentic Workflow Manager
- **Event Processing**: Handles task creation, updates, and completions
- **Trigger Management**: Manages workflow triggers based on task properties
- **Subtask Creation**: Automatically creates subtasks based on patterns
- **Duplicate Prevention**: Prevents duplicate task creation

## Usage Guide

### Basic Workflow Management

#### Creating Workflows
```bash
# Create foundation workflow
liaison workflow create foundation \
  --trigger "task-created:content=testing-strategy" \
  --actions "create-subtasks,setup-testing-framework,configure-ci" \
  --description "Foundation workflow based on owk-ghc pattern"

# Create sequential workflow
liaison workflow create sequential \
  --trigger "task-created:content=release" \
  --actions "validate-dependencies,execute-in-order,final-validation" \
  --description "Sequential workflow based on owk-12 → owk-11 pattern"

# Create discovery workflow
liaison workflow create discovery \
  --trigger "task-created:content=git-automation" \
  --actions "execute-phase,discover-tasks,create-followups" \
  --description "Discovery workflow based on owk-43 pattern"
```

#### Executing Workflows
```bash
# Run workflow with specific task
liaison workflow run foundation --task-id owk-5s7

# Run workflow in dry-run mode
liaison workflow run sequential --dry-run

# Execute workflow without task association
liaison workflow run discovery
```

#### Monitoring Workflows
```bash
# List all workflows
liaison workflow list

# View trigger configuration
liaison workflow triggers

# Check workflow execution logs
liaison workflow logs foundation --limit 10

# Watch file system changes
liaison workflow watch src/
```

### Advanced Features

#### Dependency-Aware Execution
```bash
# Respect blocking dependencies
liaison workflow run foundation --respect-dependencies

# Auto-create subtasks based on patterns
liaison workflow run sequential --auto-create-subtasks

# Execute tasks in sequential order
liaison workflow run discovery --sequential-execution
```

#### Integration with Task Management
```bash
# Create task with auto-trigger
liaison task create "Security vulnerability" \
  --priority critical \
  --auto-trigger security-response

# Update task and trigger workflows
liaison task update owk-123 --status closed
```

### Workflow Patterns in Practice

#### Foundation Pattern Example
```bash
# 1. Create foundation task
liaison task create "Implement testing framework" --priority high

# 2. Auto-trigger foundation workflow
# Automatically creates 7 dependent testing tasks:
# - Setup unit testing
# - Configure integration tests
# - Setup E2E testing
# - Create test utilities
# - Setup coverage reporting
# - Configure CI/CD testing
# - Create test documentation
```

#### Sequential Pattern Example
```bash
# 1. Create release task
liaison task create "Release v0.3.0" --priority high

# 2. Auto-trigger sequential workflow
# Executes in order:
# - Validate dependencies complete
# - Execute in dependency order
# - Run integration tests
# - Tag and release
```

#### Discovery Pattern Example
```bash
# 1. Create core work task
liaison task create "Implement git automation Phase 2" --priority medium

# 2. Execute and discover related tasks
# Automatically discovers and creates:
# - Bidirectional sync methods
# - Issue dependency validation
# - Advanced CLI commands
# - Utility methods
# - Test suite fixes
# - Git hook stabilization
```

## Configuration

### Workflow Definitions
Workflows are stored in `config/workflows/` directory as JSON files:

```json
{
  "id": "foundation",
  "name": "foundation",
  "description": "Foundation workflow based on owk-ghc pattern",
  "created_at": "2025-12-14T17:30:00Z",
  "triggers": [
    {
      "condition": "task-created:content=testing-strategy",
      "workflowId": "foundation",
      "description": "Testing strategy task created",
      "priority": 1
    }
  ],
  "actions": [
    "create-subtasks",
    "setup-testing-framework",
    "configure-ci"
  ],
  "template": "foundation"
}
```

### Trigger Configuration
Triggers are registered in the Agentic Workflow Manager:

```typescript
// Priority-based triggers
registerTrigger('created', {
  condition: (task) => task.priority === 'critical',
  workflowId: 'security-response',
  description: 'Critical priority task detected',
  priority: 1
});

// Content-based triggers
registerTrigger('created', {
  condition: (task) => task.title.toLowerCase().includes('security'),
  workflowId: 'security-response',
  description: 'Security-related task detected',
  priority: 2
});
```

## Monitoring and Analytics

### Workflow Statistics
```bash
# View trigger statistics
liaison workflow triggers

# Output:
Trigger Statistics:
  Total Triggers: 5
  Triggers by Type:
    created: 5

Recent Events:
  1. CREATED - owk-5s7 (2025-12-14T17:30:00Z)
  2. UPDATED - owk-123 (2025-12-14T17:29:00Z)
```

### File System Monitoring
```bash
# View file system watcher status
liaison workflow watch-status

# Output:
📁 File System Watcher Status:

Watcher Statistics:
  Total Triggers: 15
  Active Watchers: 3
  Watched Paths: src/, tests/, config/
  Last Git Commit: 2025-12-14T17:25:00Z

Recent File System Events:
  1. CHANGE - src/workflow.ts (2025-12-14T17:30:00Z)
  2. CHANGE - tests/workflow.test.ts (2025-12-14T17:29:00Z)
```

### API Monitoring
```bash
# List API endpoints
liaison api list

# Add new endpoint
liaison api add api-1 "Production API" "https://api.example.com/health" --interval 30 --enabled

# Check endpoint
liaison api check api-1

# Start monitoring
liaison api start
```

## Best Practices

### 1. Workflow Design
- **Keep workflows focused**: Each workflow should have a clear, specific purpose
- **Use appropriate patterns**: Foundation for setup, Sequential for pipelines, Discovery for research
- **Define clear triggers**: Use specific conditions to avoid false positives
- **Implement proper error handling**: Ensure workflows can recover from failures

### 2. Task Management
- **Use descriptive task titles**: Include keywords for automatic trigger detection
- **Set appropriate priorities**: Critical/high priority tasks auto-trigger workflows
- **Maintain dependency relationships**: Use Beads blocking relationships for proper ordering
- **Monitor task status**: Keep task status updated for accurate workflow execution

### 3. Integration
- **Leverage existing patterns**: Build on established workflow patterns
- **Use API integration**: Connect with external systems for comprehensive automation
- **Monitor system health**: Use built-in monitoring for proactive maintenance
- **Document custom workflows**: Maintain documentation for complex workflow logic

## Troubleshooting

### Common Issues

#### Workflow Not Triggering
```bash
# Check trigger configuration
liaison workflow triggers

# Verify task properties
liaison task get <task-id>

# Check workflow definition
cat config/workflows/<workflow-id>.json
```

#### Subtasks Not Created
```bash
# Check duplicate detection
liaison task list | grep "similar task title"

# Verify workflow execution
liaison workflow logs <workflow-id>

# Check Beads sync status
liaison sync status
```

#### File System Watcher Issues
```bash
# Check watcher status
liaison workflow watch-status

# Restart watchers
liaison workflow watch <path> --stop
liaison workflow watch <path>
```

### Debug Commands
```bash
# Enable verbose logging
liaison workflow run <name> --verbose

# Check system health
liaison health

# View sync status
liaison sync status

# Check Beads backend
liaison bd-ready
```

## Future Enhancements

### Planned Features
- **SQLite Event Sourcing**: Persistent event storage for audit trails
- **PM2 Process Monitoring**: Infrastructure-level workflow monitoring
- **Machine Learning**: Intelligent pattern recognition for workflow optimization
- **Custom Workflow Templates**: User-defined workflow patterns
- **Integration Marketplace**: Third-party workflow integrations

### Development Roadmap
1. **Phase 1**: SQLite event sourcing integration
2. **Phase 2**: PM2 process monitoring
3. **Phase 3**: ML-based pattern recognition
4. **Phase 4**: Advanced analytics and reporting
5. **Phase 5**: Marketplace and ecosystem

## Conclusion

The Task-Driven CLI Workflow System provides a robust foundation for automating complex workflows while respecting task dependencies and maintaining system integrity. By leveraging the Beads DAG structure and implementing intelligent workflow patterns, this system enables seamless orchestration between strategy and execution.

For additional support and advanced configuration options, refer to the implementation code in `packages/liaison/src/` and the configuration examples in `config/workflows/`.