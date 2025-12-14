# No Time-Based Scheduling Policy

## 🚫 **ARCHITECTURAL DECISION: AVOID TIME-BASED SCHEDULING**

This document serves as a permanent record that **time-based scheduling is explicitly prohibited** in the liaison-toolkit project to prevent recurring implementation of this anti-pattern.

## Why Time-Based Scheduling is Problematic

### 1. **Resource Inefficiency**
- Wastes CPU cycles checking conditions that may never be true
- Creates unnecessary load when no work needs to be done
- Cannot adapt to varying workload patterns

### 2. **Brittle and Error-Prone**
- Clock drift and timezone issues
- Difficult to test and debug
- Race conditions when multiple instances run simultaneously
- Hard to coordinate across distributed systems

### 3. **Poor User Experience**
- Delayed responses to events that need immediate attention
- Cannot prioritize urgent work
- Users cannot control when important actions occur

### 4. **Maintenance Burden**
- Requires cron job management and monitoring
- Complex cleanup when processes terminate unexpectedly
- Difficult to scale and coordinate across multiple workers

## ✅ **EVENT-DRIVEN ALTERNATIVES**

The liaison-toolkit is designed as an **agentic workflow system** that responds to events, not time. Use these patterns instead:

### 1. **Task-Driven Workflows**
```bash
# ❌ DON'T: Time-based execution
# liaison schedule workflow "security-check" "0 */6 * * *"

# ✅ DO: Event-driven execution
liaison task create "Security vulnerability found" --priority critical
# → Automatically triggers security-response workflow
```

### 2. **Webhook and API Responses**
```bash
# ❌ DON'T: Poll for changes every 5 minutes
# liaison monitor api --interval 300

# ✅ DO: Event-driven monitoring
# Set up webhooks to trigger workflows on actual events
```

### 3. **File System and Git Events**
```bash
# ❌ DON'T: Check for file changes every minute
# liaison watch --interval 60

# ✅ DO: Event-driven file watching
# Use file system watchers that trigger on actual changes
```

### 4. **Manual Triggers**
```bash
# ❌ DON'T: Automatic execution based on time
# liaison sync --schedule "0 2 * * *"

# ✅ DO: Manual or event-driven execution
liaison reconcile --manual
# or trigger from git hooks, webhooks, etc.
```

## Implementation Guidelines

### **DO:**
- ✅ Use event emitters and listeners
- ✅ Implement webhook receivers
- ✅ Create file system watchers
- ✅ Use git hooks and CI/CD triggers
- ✅ Respond to user commands and API calls
- ✅ Use message queues for async processing

### **DON'T:**
- ❌ Use `setTimeout`, `setInterval`, or `cron`
- ❌ Implement polling mechanisms
- ❌ Schedule tasks based on time intervals
- ❌ Create background timers for periodic work
- ❌ Use time-based triggers in workflows

## Existing Anti-Patterns to Remove

If you encounter these patterns, refactor them to be event-driven:

1. **`api-response-monitor.ts`** - Replace interval-based monitoring with webhook notifications
2. **Workflow scheduling commands** - Remove cron-based scheduling, use manual triggers
3. **Sync interval configurations** - Replace periodic sync with event-driven sync
4. **Background timers** - Convert to event-driven processing

## Migration Strategy

When refactoring existing time-based code:

1. **Identify the business event** that should trigger the action
2. **Replace timers** with event listeners or webhooks
3. **Update user interfaces** to show event-driven status instead of scheduled times
4. **Remove cron configurations** and scheduling infrastructure
5. **Test thoroughly** to ensure equivalent functionality with better architecture

## Monitoring and Alerting

Instead of time-based monitoring:
- Monitor actual events and their processing times
- Alert on failed event processing, not missed scheduled runs
- Track workflow execution latency and success rates
- Use health checks that respond to actual system state

## Example Refactoring

### Before (Time-Based - ❌):
```typescript
// Check API every 30 seconds
setInterval(async () => {
  const status = await checkAPI();
  if (status !== 'healthy') {
    await triggerAlert();
  }
}, 30000);
```

### After (Event-Driven - ✅):
```typescript
// Listen for actual API status changes
api.on('status-change', async (status) => {
  if (status !== 'healthy') {
    await triggerAlert();
  }
});
```

## Enforcement

This policy should be enforced through:
- Code review guidelines
- Architecture review processes
- Automated linting rules (detect setInterval/cron usage)
- Documentation requirements for any new scheduling features

## Rationale Summary

**Time-based scheduling is a legacy pattern that contradicts the event-driven, agentic architecture of liaison-toolkit.** Our system is designed to respond to actual events and user needs, not imaginary time-based triggers that waste resources and create brittle systems.

**Remember: Events happen when they happen, not when the clock tells them to.**