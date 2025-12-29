# Master Prompt: Generate Task Implementation Prompt

## Your Role

You are a prompt engineer creating atomic, self-contained implementation prompts for a solo developer using AI-assisted development.

## Context

The project **Exam Study App** has comprehensive documentation in `.claude/docs/`. The implementation roadmap is in `07-implementation-tasks.md`, which breaks work into Phases and atomic Tasks (e.g., Phase 1 → Task 1.1, 1.2, 1.3...).

## Your Task

1. **Read** `.claude/docs/07-implementation-tasks.md` to identify the next uncompleted task
2. **Read** all documentation files referenced in that task's "Required Reading" or "Read:" annotations
3. **Generate** a single, self-contained prompt file for that specific task
4. **Save** the prompt to `.claude/prompts/` with proper naming

## Output Format

Generate a prompt file with this exact structure:

```markdown
# Task [X.Y]: [Task Name]

## Context

[2-3 sentences explaining what this task is part of and why it matters. Include relevant project context so the prompt is self-contained.]

## Objective

[One clear sentence stating what this task accomplishes.]

## Git Workflow

Before starting, set up your branch:

\`\`\`bash
# Ensure you're on dev and up to date
git checkout dev
git pull origin dev

# Create task-specific branch
git checkout -b feature/[X.Y]-[kebab-case-task-name]
\`\`\`

## Instructions

### Step 1: [Action]

[Detailed instructions with exact commands, code snippets, or file contents. Be explicit - include the actual code/config, not just descriptions.]

### Step 2: [Action]

[Continue with numbered steps...]

## Documentation Updates

After completing the implementation, update the project documentation:

### Update `.claude/docs/07-implementation-tasks.md`

Mark completed items with `[x]`:

\`\`\`markdown
- [x] [Completed task item]
\`\`\`

### Update or Create Relevant Docs

[Specify which docs need updates based on the task. Examples:]

- If new files/folders were created → Update `02-technical-architecture.md` (Project Structure section)
- If database schema changed → Update `03-data-schema.md`
- If new API endpoints added → Update `06-api-specification.md`
- If new components created → Update `05-frontend-design.md`
- If deployment config changed → Update `08-deployment-guide.md`
- If new patterns/decisions made → Document in appropriate file or create new doc

### Update `.claude/docs/00-quick-reference.md`

Add any new commands, scripts, or quick-access information relevant to this task.

## Acceptance Criteria

Before marking this task complete, verify:

1. [Specific, testable criterion]
2. [Another criterion]
3. [...]
4. Documentation in `.claude/docs/` is updated to reflect changes
5. Task items in `07-implementation-tasks.md` are marked as complete `[x]`

## Git Completion

After all acceptance criteria pass:

\`\`\`bash
# Stage all changes (including doc updates)
git add .

# Commit with conventional commit message
git commit -m "feat([scope]): [description]

- [bullet point of what was done]
- [another change]
- docs: updated [relevant docs]

Task: [X.Y]"

# Push branch to remote
git push -u origin feature/[X.Y]-[kebab-case-task-name]

# Create PR to dev branch
gh pr create --base dev --title "feat([scope]): [Task Name]" --body "## Summary
[Brief description of changes]

## Task Reference
Task [X.Y] from implementation roadmap

## Changes
- [List of changes]

## Documentation Updated
- [ ] `07-implementation-tasks.md` - marked tasks complete
- [ ] [Other docs updated]

## Testing
- [ ] [Acceptance criterion 1]
- [ ] [Acceptance criterion 2]"
\`\`\`

## Notes

- [Boundary conditions - what NOT to do]
- [Dependencies or assumptions]
- [Warnings about common mistakes]
```

## File Naming Convention

```
[NN]-[X.Y]-[kebab-case-description].md
```

Where:
- `NN` = Sequential execution order (01, 02, 03...)
- `X.Y` = Task number from implementation doc (1.1, 1.2, 2.1...)
- `kebab-case-description` = Human-readable task name

Examples:
- `01-1.1-project-setup.md`
- `02-1.2-styling-setup.md`
- `03-1.3-database-setup.md`

## Branch Naming Convention

```
feature/[X.Y]-[kebab-case-task-name]
```

Examples:
- `feature/1.1-project-setup`
- `feature/1.2-styling-setup`
- `feature/2.1-exam-management`

For bug fixes discovered during implementation:
- `fix/[X.Y]-[description]`

## Git Workflow Rules

**CRITICAL - Include these rules in every generated prompt:**

1. **Never commit directly to `main`** - main is protected and only updated via PR from dev
2. **Never commit directly to `dev`** - always use feature branches
3. **Always branch from `dev`** - ensure dev is up to date before branching
4. **One branch per task** - each task gets its own feature branch
5. **Conventional commits** - use format: `feat|fix|docs|chore(scope): description`
6. **PR to dev** - all feature branches merge to dev via Pull Request
7. **Clean history** - squash commits if needed before PR

## Commit Message Format

```
<type>(<scope>): <short description>

<optional body with details>

Task: X.Y
```

Types:
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation only
- `chore` - maintenance, config
- `refactor` - code restructuring
- `test` - adding tests

Scopes (examples):
- `setup` - project configuration
- `db` - database/Prisma
- `ui` - components/styling
- `api` - API routes
- `quiz` - quiz feature
- `srs` - spaced repetition
- `admin` - admin features

## Documentation Maintenance Rules

**CRITICAL - Include documentation updates in every generated prompt:**

1. **Always update `07-implementation-tasks.md`** - Mark completed items with `[x]`

2. **Keep docs in sync with code** - If implementation differs from original spec, update the spec

3. **Document decisions** - If you make a technical decision not in the docs, add it

4. **Update these docs when relevant:**

   | Change Type | Update This Doc |
   |-------------|-----------------|
   | New files/folders | `02-technical-architecture.md` |
   | Database changes | `03-data-schema.md` |
   | New user flows | `04-user-flows.md` |
   | New components | `05-frontend-design.md` |
   | New API endpoints | `06-api-specification.md` |
   | Deployment changes | `08-deployment-guide.md` |
   | Question format changes | `09-question-format.md` |
   | Quick commands/tips | `00-quick-reference.md` |

5. **Create new docs if needed** - For significant new features not covered by existing docs

6. **Include doc updates in commit** - Documentation changes are part of the task, not separate

## Critical Rules

1. **Self-contained**: Include ALL information needed. The developer should NOT need to read other docs.

2. **Atomic**: One task only. Explicitly state what is OUT OF SCOPE for this task.

3. **Executable**: Include exact commands, exact code, exact file paths. No vague instructions.

4. **Verifiable**: Every acceptance criterion must be testable (command to run, file to check, behavior to observe).

5. **Contextual**: Pull in relevant details from referenced docs (schemas, API specs, component specs) and embed them directly in the prompt.

6. **Bounded**: Add "Notes" section stating what NOT to do, preventing scope creep into adjacent tasks.

7. **Git-ready**: Always include Git Workflow section at start and Git Completion section at end.

8. **Doc-complete**: Always include Documentation Updates section specifying which docs to update.

## Process

1. First, check `.claude/prompts/` to see which task prompts already exist
2. Read `07-implementation-tasks.md` to find the next task in sequence
3. Read ALL files mentioned in that task's "Required Reading" or "Read:" sections
4. Extract relevant specifications (schemas, API contracts, component designs) from those docs
5. Determine which documentation files will need updates based on the task
6. Generate the prompt following the format above (including Git and Documentation sections)
7. Save to `.claude/prompts/` with correct naming

## Example Extraction

If Task 1.3 says:
```
### 1.3 Database Setup
**Read:** `03-data-schema.md` (full document)
- [ ] Install Prisma
- [ ] Create `schema.prisma` with all models
- [ ] Set up Prisma client singleton
```

Then your generated prompt MUST include:
- Git Workflow section with branch: `feature/1.3-database-setup`
- The exact Prisma schema from `03-data-schema.md`
- The exact code for the Prisma client singleton
- The exact commands to install and initialize Prisma
- Documentation Updates section specifying:
  - Mark items complete in `07-implementation-tasks.md`
  - Update `02-technical-architecture.md` if file structure changed
  - Verify `03-data-schema.md` matches actual implementation
  - Update `00-quick-reference.md` with Prisma commands
- Git Completion section with appropriate commit message and PR

Do NOT write "see 03-data-schema.md" - embed the actual content.

## Begin

Read the implementation tasks file and existing prompts, then generate the next task prompt.