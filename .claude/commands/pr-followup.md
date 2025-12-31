---
description: Review PR feedback, fix critical/high issues immediately, and integrate remaining into roadmap
allowed-tools: Bash(gh:*), Bash(git:*), Bash(npm:*), Bash(npx:*), Read, Write, Edit, Grep, Glob, AskUserQuestion, Task
argument-hint: [pr-number]
---

# PR Review & Followup - Three-Phase Command

## Purpose

**Phase 1 (Review Subagent):** Analyze PR review comments, evaluate each recommendation, and decide what's worth implementing.

**Phase 1.5 (Fix Subagents):** Fix Critical and High priority issues immediately (one subagent per issue, sequential).

**Phase 2 (Integration Subagent):** Take remaining approved recommendations and intelligently integrate them into `.claude/docs/07-implementation-tasks.md`.

---

## Architecture: Main Agent + Subagents

```
Main Agent (Orchestrator)
    │
    ├─► Step 1: Get PR number
    │
    ├─► Step 2: Spawn REVIEW SUBAGENT ──► Returns decision report
    │
    ├─► Step 3: Present report to user, get approval (AskUserQuestion)
    │
    ├─► Step 4: For each Critical/High issue (sequential):
    │       └─► Spawn FIX SUBAGENT ──► Fixes one issue, returns result
    │
    ├─► Step 5: Spawn INTEGRATION SUBAGENT ──► Updates roadmap
    │
    └─► Step 6: Final summary to user
```

**Why subagents?** Each phase involves significant context (reading files, analyzing comments, making edits). Using subagents keeps the main orchestrator lightweight and prevents context pollution.

---

# MAIN AGENT WORKFLOW

## Step 1: Get PR Number

```bash
# If $ARGUMENTS provided, use it as PR number
# Otherwise, get PR for current branch:
gh pr view --json number -q '.number'
```

Store the PR number for passing to subagents.

## Step 2: Spawn Review Subagent

Use the Task tool to spawn a **general-purpose** subagent:

```
Task(
  subagent_type: "general-purpose",
  description: "Analyze PR #X review comments",
  prompt: <REVIEW_AGENT_PROMPT below with PR number>
)
```

Wait for the subagent to return the decision report.

## Step 3: Present to User and Get Approval

Parse the decision report from the Review Subagent and use AskUserQuestion:

1. Show the summary (total comments, actionable, implement vs skip)
2. List Critical/High items recommended for immediate fix
3. List Medium/Low items for roadmap
4. Ask: "Approve this plan? Fix Critical/High now?"

## Step 4: Execute Immediate Fixes (Sequential Subagents)

For each Critical/High item approved for immediate fix, spawn a Fix Subagent:

```
Task(
  subagent_type: "general-purpose",
  description: "Fix: [issue title]",
  prompt: <FIX_AGENT_PROMPT below with issue details>
)
```

**IMPORTANT:** Run these SEQUENTIALLY (one at a time). Wait for each to complete before spawning the next.

After each fix, briefly report: "✅ Fixed: [title]"

## Step 5: Spawn Integration Subagent

Use the Task tool to spawn Integration Subagent:

```
Task(
  subagent_type: "general-purpose",
  description: "Integrate PR #X items to roadmap",
  prompt: <INTEGRATION_AGENT_PROMPT below with remaining items>
)
```

## Step 6: Final Summary

Report to user:
- Critical/High issues fixed: X
- Items added to roadmap: Y
- Items skipped: Z

---

# SUBAGENT PROMPTS

## REVIEW_AGENT_PROMPT

Use this prompt when spawning the Review Subagent (replace `{pr_number}` with actual PR number):

```
# Review Agent - PR #{pr_number}

You are a Review Agent. Analyze all review comments on PR #{pr_number} and produce a decision report.

## Step 1: Fetch All Review Data

Run these commands to get all review information:

gh pr view {pr_number} --json number,title,body,state,url,reviews,comments

gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --jq '.[] | {id, path, line, body, user: .user.login}'

gh api repos/{owner}/{repo}/pulls/{pr_number}/reviews --jq '.[] | {id, state, body, user: .user.login}'

## Step 2: Classify Each Comment

For each comment, classify it:
| Type | Action |
|------|--------|
| Actionable suggestion | Evaluate |
| Question | Skip |
| Approval/Praise | Skip |
| Style preference | Evaluate (Low priority) |
| Security concern | Evaluate (Critical/High priority) |
| Bug report | Evaluate (High priority) |

## Step 3: Decide IMPLEMENT or SKIP

**IMPLEMENT if:** Security issue, bug, performance impact, maintainability benefit, aligns with project patterns
**SKIP if:** Pure style preference, already addressed, out of scope, requires major refactor, subjective

## Step 4: Return Decision Report

Return a structured report in this EXACT format:

---BEGIN REPORT---
# PR #{pr_number} Review Analysis

## Summary
- Total comments: X
- Actionable items: Y
- Recommend to implement: Z
- Recommend to skip: W

## IMPLEMENT

### 1. [Title]
- Priority: [Critical | High | Medium | Low]
- Category: [Security | Bug | Performance | Code Quality | Testing | Docs]
- File: [path:line] (if applicable)
- Comment: "[original comment]"
- Reasoning: [why implement]

## SKIP

### 1. [Title]
- Comment: "[original comment]"
- Reasoning: [why skip]

---END REPORT---
```

---

## FIX_AGENT_PROMPT

Use this prompt for each Fix Subagent (one per issue, sequential):

```
# Fix Agent - {issue_title}

You are a Fix Agent. Fix this single issue and report back.

## Issue Details
- Title: {issue_title}
- Priority: {priority}
- Category: {category}
- File: {filepath}
- Original Comment: "{comment}"

## Instructions

1. Read the relevant file(s)
2. Implement the fix
3. Verify the change is correct
4. If tests exist, run them

## Constraints
- Make ONLY the changes needed to fix this specific issue
- If the fix is more complex than expected (> 30 min effort), STOP and return:
  "DEFER: [reason why this should go to roadmap instead]"
- Do not fix other issues you might notice

## Return Format

---BEGIN FIX RESULT---
Status: [FIXED | DEFER]
File(s) Changed: [list of files]
Changes Made: [brief description]
Tests Run: [yes/no, results if yes]
---END FIX RESULT---
```

---

## INTEGRATION_AGENT_PROMPT

Use this prompt when spawning the Integration Subagent:

```
# Integration Agent - PR #{pr_number}

You are an Integration Agent. Add the following items to the implementation roadmap.

## Items to Add

{items_list}
(Format: Title | Priority | Category | File | Comment)

## Instructions

### Step 1: Read Current Roadmap
Read `.claude/docs/07-implementation-tasks.md` thoroughly. Understand:
- Existing phases and their themes
- Task numbering scheme
- Which tasks are completed vs pending

### Step 2: Categorize Items

| Category | Typical Phase |
|----------|---------------|
| Security | Security Phase or Phase 1 |
| Infrastructure | Phase 1 (Foundation) |
| Database | Phase 1 (Foundation) |
| API | Phase 2 (Core Features) |
| Frontend | Phase 2-3 (Features) |
| Testing | Testing Phase or same as related feature |
| Performance | Phase 4+ (Polish) |
| Documentation | Phase 4+ (Polish) |
| Code Quality | Same phase as related code |

### Step 3: Determine Placement

Decision tree:
- Related to existing incomplete task? → Add as subtask
- Fits existing phase theme? → Add as new task
- 3+ similar items (e.g., security)? → Create new phase
- Otherwise → Add to most relevant phase

### Step 4: Make Changes

Edit `.claude/docs/07-implementation-tasks.md`:

For new tasks:
### X.Y [Task Name]
**Source:** PR #{pr_number} review
- [ ] [Subtask description]
  - File: `[filepath]`

For subtasks on existing tasks:
- [ ] **[PR #{pr_number}]** [Description]

### Step 5: Validate
- No duplicate task numbers
- Completed tasks still marked [x]
- Logical phase ordering

### Step 6: Return Summary

---BEGIN INTEGRATION RESULT---
## Changes Made
- New tasks added: X
- Subtasks added: Y
- New phases created: Z

## Details
[List each task/subtask added with location]
---END INTEGRATION RESULT---
```

---

# REFERENCE: Decision Tree for Task Placement

```
Is it related to an existing incomplete task?
├── YES → Add as subtask to that task
└── NO → Does it fit an existing phase's theme?
    ├── YES → Add as new task in that phase (next available number)
    └── NO → Are there 3+ similar items (e.g., security)?
        ├── YES → Create new dedicated phase
        └── NO → Add to most relevant phase
```

## Notes

- **Preserve existing work**: Never remove or uncheck completed tasks
- **Maintain consistency**: Follow existing formatting and style
- **Be specific**: Include file paths and line references
- **Link context**: Reference source PR number for traceability
- **Skip noise**: Ignore approvals, praise, resolved comments
