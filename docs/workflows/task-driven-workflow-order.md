# Task-Driven Workflow Order: Complete Guide

## 🎯 The 6-Step Workflow Order

### Overview
Liaison's agentic workflow system follows a precise 6-step order that ensures tasks drive workflows automatically, creating a closed-loop automation system where work creates more work intelligently.

---

## 📋 Step-by-Step Workflow Order

### Step 1: Create ONE Task
**Purpose**: Single point of entry for all work

**How it works**:
- User creates one focused task describing the issue or work needed
- Task includes clear title, description, and appropriate priority
- System captures task metadata for automatic workflow selection

**Best Practices**:
```bash
# ✅ Good: Focused, clear title with relevant keywords
liaison task create "Security: XSS vulnerability in login form" --priority critical

# ✅ Good: Clear description with context
liaison task create "Bug: Production API returns 500 for user profile" \
  --description "API endpoint /api/users/profile returning 500 error for all requests" \
  --priority high

# ❌ Bad: Vague, no keywords, wrong priority
liaison task create "Fix stuff" --priority low
```

**Key Points**:
- **Create ONE task per issue** - don't create subtasks manually
- **Use descriptive titles** with relevant keywords (security, bug, documentation)
- **Set appropriate priority** for automatic workflow triggering
- **Let workflows create subtasks** - this is the core automation principle

---

### Step 2: System Triggers Workflow Automatically
**Purpose**: Intelligent workflow selection without manual intervention

**How it works**:
- AgenticWorkflowManager evaluates task properties immediately upon creation
- Triggers based on multiple criteria: priority, content keywords, tags, explicit auto-trigger
- No manual workflow selection required

**Trigger Types**:

#### Priority-Based Triggers
```bash
# Critical priority → security-response workflow
liaison task create "Critical security issue" --priority critical

# High priority → high-priority-response workflow  
liaison task create "Production outage" --priority high

# Medium priority → standard workflow
liaison task create "Feature request" --priority medium

# Low priority → backlog workflow
liaison task create "Documentation typo" --priority low
```

#### Content-Based Triggers
```bash
# Keywords in title trigger specific workflows
liaison task create "Security audit required" 
# → Contains "security" → triggers security-response

liaison task create "Fix bug in production"
# → Contains "bug" and "production" → triggers bug-fix

liaison task create "Update README documentation"
# → Contains "documentation" → triggers documentation-update
```

#### Explicit Auto-Triggers
```bash
# Force specific workflow regardless of content/priority
liaison task create "Custom task" --auto-trigger "custom-workflow"
```

**Trigger Evaluation Order**:
1. **Explicit auto-trigger** (highest priority)
2. **Content-based analysis** (keyword matching)
3. **Priority-based selection** (fallback)
4. **Default workflow** (last resort)

---

### Step 3: Workflow Creates Subtasks
**Purpose**: Automatic breakdown of work into focused, actionable items

**How it works**:
- Selected workflow automatically generates relevant subtasks
- Each subtask is focused and actionable
- Subtasks inherit appropriate priority and metadata
- Subtask definitions are workflow-specific

**Example Subtask Creation**:

#### Security Response Workflow
```bash
# Parent task: "Security: XSS vulnerability in login form"
# → Automatically creates 4 subtasks:

1. "Investigate security vulnerability" (priority: critical)
2. "Isolate affected systems" (priority: high)  
3. "Develop security patch" (priority: high)
4. "Verify fix effectiveness" (priority: medium)
```

#### Bug Fix Workflow
```bash
# Parent task: "Bug: Production API returns 500 for user profile"
# → Automatically creates 5 subtasks:

1. "Reproduce bug" (priority: high)
2. "Debug root cause" (priority: high)
3. "Implement fix" (priority: medium)
4. "Test fix thoroughly" (priority: medium)
5. "Deploy fix to production" (priority: low)
```

#### Documentation Update Workflow
```bash
# Parent task: "Update API documentation for agentic workflows"
# → Automatically creates 3 subtasks:

1. "Update documentation content" (priority: medium)
2. "Review documentation changes" (priority: medium)
3. "Publish updated documentation" (priority: low)
```

**Key Points**:
- **Subtasks are created automatically** - don't create manually
- **Each subtask is focused** on a specific aspect of the work
- **Priorities are inherited** based on workflow logic
- **Subtasks can trigger additional workflows** (closed-loop automation)

---

### Step 4: Workflows Execute Fixes
**Purpose**: Automated execution of specialized work for each subtask

**How it works**:
- Each subtask can trigger additional specialized workflows
- Automated execution of investigation, development, testing, deployment
- Progress tracking throughout execution
- Specialized workflows for different types of work

**Execution Examples**:

#### Investigation Workflow
```bash
# Subtask: "Investigate security vulnerability"
# → Triggers investigation workflow:
#   - Analyze security issue
#   - Determine impact scope
#   - Identify affected systems
#   - Document findings
```

#### Development Workflow
```bash
# Subtask: "Develop security patch"
# → Triggers development workflow:
#   - Create fix implementation
#   - Write unit tests
#   - Perform code review
#   - Validate solution
```

#### Testing Workflow
```bash
# Subtask: "Verify fix effectiveness"
# → Triggers testing workflow:
#   - Run security tests
#   - Perform regression testing
#   - Validate fix in staging
#   - Document test results
```

**Key Points**:
- **Each subtask triggers specialized workflows** based on work type
- **Workflows execute automatically** without manual intervention
- **Progress is tracked** throughout execution
- **Workflows can create additional subtasks** if needed

---

### Step 5: Progress Tracked Automatically
**Purpose**: Real-time status synchronization across all work items

**How it works**:
- Task status updates reflect workflow progress
- Subtask completion tracked automatically
- Real-time status synchronization between tasks and workflows
- Complete audit trail of all work

**Status Tracking Examples**:

#### Task Status Progression
```bash
# Initial state
owk-abc123 | Security: XSS vulnerability in login form | 🔴 open

# During workflow execution
owk-abc123 | Security: XSS vulnerability in login form | 🟡 in-progress

# When subtasks complete
owk-abc123 | Security: XSS vulnerability in login form | 🟢 closed
```

#### Subtask Status Tracking
```bash
# Subtasks created and tracked automatically
owk-def456 | Investigate security vulnerability | 🟢 closed
owk-ghi789 | Isolate affected systems | 🟢 closed  
owk-jkl012 | Develop security patch | 🟡 in-progress
owk-mno345 | Verify fix effectiveness | 🔴 open
```

**Automatic Status Updates**:
- **Workflow starts** → Parent task status changes to "in-progress"
- **Subtask completes** → Subtask status changes to "closed"
- **All subtasks complete** → Parent task status changes to "closed"
- **Workflow fails** → Appropriate error status and notifications

---

### Step 6: Git Commits Triggered
**Purpose**: Automatic version control integration with complete context

**How it works**:
- Automatic commits when workflows complete successfully
- Descriptive commit messages with workflow context
- Complete audit trail maintained in version control
- Integration with existing git workflows

**Commit Generation Examples**:

#### Security Workflow Completion
```bash
# Automatic commit when security workflow completes
git commit -m "feat: Resolve security vulnerability in login form

- Security response workflow completed successfully
- Investigation: Identified XSS vulnerability in authentication
- Isolation: Contained affected login systems  
- Patch: Implemented input sanitization and validation
- Verification: Confirmed fix prevents XSS attacks

Workflow: security-response
Parent Task: owk-abc123
Subtasks: owk-def456, owk-ghi789, owk-jkl012, owk-mno345

Closes: owk-abc123"
```

#### Bug Fix Workflow Completion
```bash
# Automatic commit when bug fix workflow completes  
git commit -m "fix: Resolve production API 500 error for user profile

- Bug fix workflow completed successfully
- Reproduction: Confirmed 500 error on /api/users/profile
- Debug: Identified null pointer exception in user service
- Fix: Added null check and error handling
- Testing: Verified fix resolves 500 error
- Deployment: Deployed to production with zero downtime

Workflow: bug-fix
Parent Task: owk-def456
Subtasks: owk-ghi789, owk-jkl012, owk-mno345, owk-pqr678, owk-stu901

Closes: owk-def456"
```

**Commit Features**:
- **Descriptive messages** with complete workflow context
- **Task and subtask references** for traceability
- **Workflow identification** for process tracking
- **Automatic execution** - no manual commits required

---

## 🚀 Real-World Examples

### Example 1: Security Incident Response
```bash
# Step 1: Create ONE task
liaison task create "Security: XSS vulnerability in login form" \
  --description "Cross-site scripting vulnerability discovered in user authentication form" \
  --priority critical

# Steps 2-6: Automatic execution
# → security-response workflow triggered automatically
# → Creates 4 subtasks: investigate, isolate, patch, verify
# → Each subtask triggers specialized workflows
# → Progress tracked automatically throughout execution
# → Git commit generated when complete
# → Parent task owk-abc123 closed automatically
```

### Example 2: Production Bug Fix
```bash
# Step 1: Create ONE task
liaison task create "Bug: Production API returns 500 for user profile" \
  --description "API endpoint /api/users/profile returning 500 error for all requests" \
  --priority high

# Steps 2-6: Automatic execution
# → bug-fix workflow triggered automatically
# → Creates 5 subtasks: reproduce, debug, implement, test, deploy
# → Automated execution and tracking
# → Git commit with bug fix context
# → Parent task owk-def456 closed automatically
```

### Example 3: Documentation Updates
```bash
# Step 1: Create ONE task
liaison task create "Update API documentation for agentic workflows" \
  --description "Add comprehensive documentation for task-driven workflow system" \
  --auto-trigger "documentation-update"

# Steps 2-6: Automatic execution
# → documentation-update workflow triggered automatically
# → Creates 3 subtasks: update, review, publish
# → Automated documentation process
# → Git commit with documentation changes
# → Parent task owk-ghi789 closed automatically
```

---

## 🔧 Troubleshooting

### Issue: Workflow Not Triggering
**Symptoms**: Task created but no workflow runs

**Common Causes**:
1. Task doesn't match trigger conditions
2. AgenticWorkflowManager not initialized
3. Workflow configuration missing
4. Priority set incorrectly

**Diagnostic Steps**:
```bash
# 1. Check active triggers
liaison workflow triggers

# 2. Verify task properties
liaison task get <task-id>

# 3. Check available workflows
liaison workflow list

# 4. Test trigger manually
liaison workflow run <workflow-name> --task-id <task-id>
```

**Solutions**:
1. **Fix Task Content**: Ensure title contains relevant keywords
2. **Set Correct Priority**: Use appropriate priority level
3. **Use Explicit Trigger**: Add `--auto-trigger` flag
4. **Check Workflow Config**: Verify workflow exists in `config/workflows/`

### Issue: Subtasks Not Created
**Symptoms**: Workflow runs but no subtasks generated

**Common Causes**:
1. Workflow missing subtask definitions
2. BeadsAdapter not properly connected
3. Task ID not passed to workflow
4. Subtask creation failed silently

**Diagnostic Steps**:
```bash
# 1. Check workflow configuration
cat config/workflows/<workflow-name>.json

# 2. Check workflow execution logs
liaison workflow logs <workflow-name>

# 3. Verify task exists
liaison task get <task-id>

# 4. Test subtask creation manually
liaison workflow run <workflow-name> --task-id <task-id> --dry-run
```

**Solutions**:
1. **Add Subtask Definitions**: Update workflow configuration
2. **Check BeadsAdapter**: Verify connection to task backend
3. **Verify Task ID**: Ensure task exists and is accessible
4. **Check Permissions**: Ensure system can create tasks

### Issue: Git Commits Not Generated
**Symptoms**: Workflows complete but no automatic commits

**Common Causes**:
1. Workflow completion listener not set up
2. Git repository not initialized
3. Commit automation disabled
4. No changes to commit

**Diagnostic Steps**:
```bash
# 1. Check git repository status
git status

# 2. Check workflow completion
liaison workflow logs <workflow-name>

# 3. Verify git configuration
git config --list

# 4. Test commit manually
git add .
git commit -m "test commit"
```

**Solutions**:
1. **Initialize Git Repository**: Run `git init` if needed
2. **Check Workflow Listener**: Verify AgenticWorkflowManager setup
3. **Enable Commit Automation**: Check workflow configuration
4. **Stage Changes**: Ensure there are changes to commit

---

## 📚 Best Practices

### Task Creation Best Practices
1. **One Task Per Issue**: Never create multiple tasks for the same issue
2. **Descriptive Titles**: Include relevant keywords for automatic triggering
3. **Appropriate Priority**: Set priority based on impact and urgency
4. **Clear Descriptions**: Provide context and impact information
5. **Let System Work**: Don't manually create subtasks or select workflows

### Workflow Monitoring Best Practices
1. **Check Trigger Status**: Use `liaison workflow triggers` regularly
2. **Monitor Execution**: Use `liaison workflow logs` to track progress
3. **Verify Completion**: Ensure tasks close when workflows complete
4. **Review Commits**: Check automatic commits for accuracy

### Troubleshooting Best Practices
1. **Start with Diagnostics**: Use built-in diagnostic commands
2. **Check Configuration**: Verify workflow and system configuration
3. **Test Incrementally**: Use `--dry-run` for testing
4. **Review Logs**: Check workflow and system logs for errors

---

## 📖 Additional Resources

### Documentation References
- `AGENTS.md` - Agent guidelines and workflow patterns
- `docs/TASK_MANAGEMENT.md` - Task management commands
- `config/workflows/` - Workflow configuration examples
- `README.md` - Quick start and overview

### CLI Commands Reference
```bash
# Task Management
liaison task create --help
liaison task list --help
liaison task get --help
liaison task update --help

# Workflow Management
liaison workflow list --help
liaison workflow run --help
liaison workflow triggers --help
liaison workflow logs --help

# System Status
liaison workflow watch-status --help
liaison api list --help
```

### Configuration Files
- `config/workflows/security-response.json` - Security workflow configuration
- `config/workflows/bug-fix.json` - Bug fix workflow configuration
- `config/workflows/documentation-update.json` - Documentation workflow configuration

---

## 🎯 Key Takeaways

1. **Create ONE focused task** per issue - this is the entry point
2. **System selects workflow automatically** based on task properties
3. **Workflows create subtasks automatically** - don't do this manually
4. **Subtasks trigger specialized workflows** for closed-loop automation
5. **Progress is tracked automatically** throughout execution
6. **Git commits are generated automatically** when workflows complete

Following this 6-step order ensures maximum automation and efficiency in your development workflow. The system is designed to handle the complexity while you focus on high-value work.

---

*Last updated: 2025-12-14*
*Version: v0.6.0*
*For issues or questions, refer to troubleshooting section or check workflow logs*