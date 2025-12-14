# AGENTS.md - Updated with Bun Build Guidelines

## Golden Path: Don't Look Behind the Curtain to Make Decisions

### The Problem

When agents can see the full codebase, they tend to:
- Infer intent from implementation details
- Make independent decisions without asking
- Execute before approval
- Assume patterns from what they see
- Invent details (IDs, structures) to fill gaps

### The Solution

**When you ask me something, I must:**

1. **Ask clarifying questions first** (don't use code visibility to answer for you)
   - Example ❌: See task structure, assume what sub-tasks should be created
   - Example ✅: "Do you want me to create subtasks in Beads, or reference existing ones?"

2. **Present a plan before executing** (never code without approval)
   - Show what you propose
   - Wait for explicit "yes" before implementing
   - If there are options, present all of them

3. **Only read code when explicitly asked**
   - "What's the current structure?" → look
   - "How should we integrate?" → look
   - Generic request → ask first, don't assume by looking

4. **Codebase visibility serves your questions, not my decisions**
   - Use it to give better answers to what you ask
   - Never use it to make independent choices
   - Example: You ask "should we use owk-dtu?", then I can look and confirm

## Workflow Checklist

When given a task:

- [ ] **Do I have all info to proceed?** If no → Ask
- [ ] **Are there multiple approaches?** If yes → Present options
- [ ] **Do I need approval?** If yes → Wait for explicit approval
- [ ] **Should I look at code?** Only if you asked, or if you asked me to "check"

## Communication Patterns

### ✅ Correct Pattern

```
User: "Add task creation to liaison CLI"

Agent: "Before I build this, clarifying questions:
1. Should agents use `liaison task create` or `liaison create`?
2. Should output default to human-readable or JSON?
3. Should we use existing BeadsAdapter or create new wrapper?

Here's my proposed plan once you answer those."

[User answers]

Agent: "Here's the implementation plan: 
  - Create packages/liaison/src/commands/task.ts
  - Wire into cli.ts
  - Use BeadsAdapter underneath
  
  Ready to proceed?"

[User says "yes"]

Agent: [implements]
```

### ❌ Incorrect Pattern

```
User: "Add task creation to liaison CLI"

Agent: [sees BeadsAdapter exists, sees CLI structure]
Agent: [creates task command immediately]
Agent: [uses JSON output]
Agent: [picks names arbitrarily]
Agent: [shows result]

User: "That's not what I wanted..."
```

## Specific Rules for This Project

### Task/Issue IDs

- ❌ **Never invent IDs** (like owk-v5o-09-01)
- ✅ Use `bun x bd create` to generate real task IDs
- ✅ Or ask which existing ID to reference

### CLI Commands

- ❌ Don't assume "it should work like X"
- ✅ Ask: "Should liaison task create... be X or Y?"
- ✅ Present options for naming/structure

### File Structure

- ❌ Don't infer from .gitignore or existing patterns
- ✅ Ask: "Where should this go?"
- ✅ Show multiple locations if unclear

### Task Dependencies

- ❌ Don't create subtasks without approval
- ✅ Ask: "Should we break this into atomic subtasks?"
- ✅ Wait for answer before creating

## Build System & Development Workflow

- ✅ **Primary Build Tool**: Use Bun for all builds (`bun run build`)
- ✅ **Clean TypeScript Imports**: No `.js` extensions needed in source code
- ✅ **Type Checking Only**: `bun run type-check` uses `tsc --noEmit` for validation
- ✅ **Development Mode**: `bun run dev` for hot reloading during development
- ✅ **Package Manager**: Use `bun install` and `bun ci` (not npm/yarn)
- ✅ **Direct Execution**: Use `bun packages/liaison/src/cli.ts` for development
- ❌ **Deprecated**: Never use `tsc` for compilation, only for type checking
- ✅ **Smoke Testing**: Run `./scripts/cli_smoke_test.sh` after builds

### CLI Execution Patterns

- ✅ **Development**: `bun packages/liaison/src/cli.ts [command]`
- ✅ **Production**: `node packages/liaison/dist/cli.js [command]`
- ✅ **Consistency**: All documentation should reference Bun execution pattern

## Documentation Standards

- Keep this file as source of truth
- Append new patterns here as they arise
- Every agent should read this before asking questions

## When I Failed This Session

Examples of breaking the golden path:

1. ❌ Created reconciler implementation without showing plan first
2. ❌ Invented task IDs (owk-v5o-09-01 through -07) instead of asking
3. ❌ Added items to Cody tasklist without approval
4. ❌ Used code visibility to make decisions (test structure, file locations)
5. ❌ Assumed approval to proceed without waiting

## Success Stories

### Phase 1: Build System Migration (COMPLETED 2025-12-14)
**Problem**: CLI built with tsc failed to run in Node.js ESM environment
**Solution**: Successfully migrated to Bun build system
**Result**: 
- ✅ Build time reduced from ~2-3s to ~40ms
- ✅ ESM compatibility resolved
- ✅ Hot reloading available
- ✅ Smoke tests pass
- ✅ Dogfooding workflow restored

## How Future Sessions Should Start

New agents should:

1. Read this file first
2. Read the task at hand
3. Ask clarifying questions
4. Present plan
5. Wait for approval
6. Execute only after approval

---

**Last updated**: 2025-12-14
**Golden path enforced**: Ask → Plan → Approve → Execute (never: See → Assume → Execute)
**Build system**: Bun-native with TypeScript support