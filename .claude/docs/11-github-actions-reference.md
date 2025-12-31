# GitHub Actions Reference Guide

Complete reference for GitHub Actions workflows, triggers, syntax, and best practices.

**Last Updated:** December 2025

---

## Table of Contents

1. [Workflow Structure](#workflow-structure)
2. [Triggers (Events)](#triggers-events)
3. [Activity Types](#activity-types)
4. [Jobs & Steps](#jobs--steps)
5. [Runners](#runners)
6. [Expressions & Conditionals](#expressions--conditionals)
7. [Contexts](#contexts)
8. [Environment Variables & Secrets](#environment-variables--secrets)
9. [Matrix Strategy](#matrix-strategy)
10. [Caching](#caching)
11. [Artifacts](#artifacts)
12. [Reusable Workflows](#reusable-workflows)
13. [Concurrency](#concurrency)
14. [Permissions & Security](#permissions--security)
15. [Popular Actions](#popular-actions)
16. [Best Practices](#best-practices)

---

## Workflow Structure

```yaml
name: Workflow Name                    # Optional display name

on:                                    # Triggers (required)
  push:
    branches: [main]

permissions:                           # Token permissions (recommended)
  contents: read

env:                                   # Workflow-level env vars
  NODE_ENV: production

concurrency:                           # Prevent duplicate runs
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:                                  # Jobs to run (required)
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

---

## Triggers (Events)

### Repository Events

| Trigger | Description |
|---------|-------------|
| `push` | Commits or tags pushed |
| `create` | Git branch or tag created |
| `delete` | Git branch or tag deleted |
| `fork` | Repository is forked |
| `gollum` | Wiki page created/updated |
| `public` | Repository changes from private to public |
| `watch` | Repository is starred |
| `branch_protection_rule` | Branch protection rules created/edited/deleted |

### Pull Request Events

| Trigger | Description |
|---------|-------------|
| `pull_request` | PR opened, closed, synchronized, etc. |
| `pull_request_review` | PR review submitted/edited/dismissed |
| `pull_request_review_comment` | Comment on PR diff |
| `pull_request_target` | Same as `pull_request` but runs in base repo context |
| `merge_group` | PR added to merge queue |

### Issue & Discussion Events

| Trigger | Description |
|---------|-------------|
| `issues` | Issue opened, edited, closed, labeled, etc. |
| `issue_comment` | Comment on issue or PR |
| `discussion` | Discussion created/edited/deleted |
| `discussion_comment` | Comment on discussion |
| `label` | Label created/edited/deleted |
| `milestone` | Milestone created/closed/opened/edited/deleted |

### CI/CD Events

| Trigger | Description |
|---------|-------------|
| `check_run` | Individual test/check activity |
| `check_suite` | Collection of check runs |
| `deployment` | Deployment created |
| `deployment_status` | Deployment status updated |
| `status` | Git commit status changes |
| `page_build` | Push to GitHub Pages source |
| `registry_package` | Package published or updated |
| `release` | Release published/unpublished/created/edited/deleted |

### Manual & Scheduled Triggers

| Trigger | Description |
|---------|-------------|
| `workflow_dispatch` | Manual trigger via UI/API/CLI |
| `schedule` | Cron-based scheduled runs |
| `repository_dispatch` | Custom events via API |

### Workflow Chaining

| Trigger | Description |
|---------|-------------|
| `workflow_call` | Called by another workflow (reusable workflows) |
| `workflow_run` | Triggered when another workflow completes |

### Trigger Examples

```yaml
on:
  # Simple triggers
  push:
  pull_request:

  # With branch/path filters
  push:
    branches: [main, dev, 'release/**']
    paths: ['src/**', '*.js']
    paths-ignore: ['docs/**', '**.md']
    tags: ['v*']

  # With activity types
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]
    branches: [main]

  # Scheduled (cron)
  schedule:
    - cron: '0 0 * * *'        # Daily at midnight UTC
    - cron: '0 */6 * * *'      # Every 6 hours
    - cron: '0 9 * * 1'        # Mondays at 9am UTC

  # Manual trigger with inputs
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment environment'
        required: true
        default: 'staging'
        type: choice
        options: [staging, production]
      debug:
        description: 'Enable debug mode'
        type: boolean
        default: false

  # Trigger on workflow completion
  workflow_run:
    workflows: ["Build"]
    types: [completed]
    branches: [main]
```

---

## Activity Types

### pull_request

**Default:** `opened`, `synchronize`, `reopened`

**All types:**
- `assigned`, `unassigned`
- `labeled`, `unlabeled`
- `opened`, `edited`, `closed`, `reopened`
- `synchronize` (new commits pushed)
- `ready_for_review`, `converted_to_draft`
- `review_requested`, `review_request_removed`
- `auto_merge_enabled`, `auto_merge_disabled`
- `enqueued`, `dequeued`
- `locked`, `unlocked`
- `milestoned`, `demilestoned`

### issues

**All types:**
- `opened`, `edited`, `deleted`, `closed`, `reopened`
- `assigned`, `unassigned`
- `labeled`, `unlabeled`
- `locked`, `unlocked`
- `transferred`, `pinned`, `unpinned`
- `milestoned`, `demilestoned`

### issue_comment

**All types:** `created`, `edited`, `deleted`

### pull_request_review

**All types:** `submitted`, `edited`, `dismissed`

### release

**All types:**
- `published`, `unpublished`
- `created`, `edited`, `deleted`
- `prereleased`, `released`

### check_run

**All types:** `created`, `completed`, `rerequested`, `requested_action`

### check_suite

**All types:** `completed`, `requested`, `rerequested`

### discussion

**All types:**
- `created`, `edited`, `deleted`
- `answered`, `unanswered`
- `category_changed`, `transferred`
- `labeled`, `unlabeled`
- `locked`, `unlocked`
- `pinned`, `unpinned`
- `closed`, `reopened`

### workflow_run

**All types:** `completed`, `in_progress`, `requested`

### workflow_job

**All types:** `completed`, `in_progress`, `queued`, `waiting`

---

## Jobs & Steps

### Job Syntax

```yaml
jobs:
  job-id:                              # Unique identifier (alphanumeric, -, _)
    name: Display Name                 # Optional display name
    runs-on: ubuntu-latest             # Runner (required)
    needs: [other-job]                 # Job dependencies
    if: ${{ github.ref == 'refs/heads/main' }}  # Conditional
    timeout-minutes: 30                # Job timeout (default: 360)
    continue-on-error: false           # Don't fail workflow if job fails

    environment:                       # Deployment environment
      name: production
      url: https://example.com

    env:                               # Job-level env vars
      NODE_ENV: test

    defaults:
      run:
        shell: bash
        working-directory: ./app

    outputs:                           # Job outputs
      version: ${{ steps.build.outputs.version }}

    steps:
      - name: Step name
        uses: actions/checkout@v4      # Use an action
        with:                          # Action inputs
          fetch-depth: 0

      - name: Run command
        run: npm test                  # Shell command
        env:                           # Step-level env vars
          CI: true
```

### Step Properties

```yaml
steps:
  - name: Step Name                    # Display name
    id: step-id                        # Reference ID for outputs
    if: success()                      # Conditional execution
    uses: owner/repo@version           # Action to use
    with:                              # Action inputs
      key: value
    env:                               # Environment variables
      KEY: value
    run: |                             # Shell commands (multiline)
      echo "Hello"
      npm test
    shell: bash                        # Shell type
    working-directory: ./subdir        # Working directory
    timeout-minutes: 10                # Step timeout
    continue-on-error: true            # Continue on failure
```

### Job Dependencies

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm build

  test:
    needs: build                       # Waits for build
    runs-on: ubuntu-latest
    steps:
      - run: npm test

  deploy:
    needs: [build, test]               # Waits for both
    runs-on: ubuntu-latest
    if: success()                      # Only if both succeeded
    steps:
      - run: ./deploy.sh

  notify:
    needs: [build, test, deploy]
    if: always()                       # Run even if others failed
    runs-on: ubuntu-latest
    steps:
      - run: ./notify.sh
```

### Passing Data Between Jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      version: ${{ steps.version.outputs.value }}
    steps:
      - id: version
        run: echo "value=1.2.3" >> $GITHUB_OUTPUT

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying version ${{ needs.build.outputs.version }}"
```

---

## Runners

### GitHub-Hosted Runners

| Label | OS | Architecture | Notes |
|-------|----|--------------|----|
| `ubuntu-latest` | Ubuntu 24.04 | x64 | Most common |
| `ubuntu-24.04` | Ubuntu 24.04 | x64 | Specific version |
| `ubuntu-22.04` | Ubuntu 22.04 | x64 | LTS |
| `ubuntu-slim` | Ubuntu (container) | x64 | Lower cost, lightweight |
| `windows-latest` | Windows Server 2022 | x64 | |
| `windows-2022` | Windows Server 2022 | x64 | |
| `windows-2019` | Windows Server 2019 | x64 | |
| `macos-latest` | macOS 14 (Sonoma) | ARM64 | M1 chip |
| `macos-14` | macOS 14 | ARM64 | |
| `macos-13` | macOS 13 | x64 | Intel |

### Self-Hosted Runners

```yaml
jobs:
  build:
    # Single label
    runs-on: self-hosted

    # Multiple labels (AND logic)
    runs-on: [self-hosted, linux, x64, gpu]

    # Runner group
    runs-on:
      group: my-runner-group
      labels: [linux, x64]
```

### Dynamic Runner Selection

```yaml
jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
```

---

## Expressions & Conditionals

### Expression Syntax

```yaml
# Full syntax (required in most places)
${{ expression }}

# Short syntax (optional in `if`)
if: github.ref == 'refs/heads/main'
if: ${{ github.ref == 'refs/heads/main' }}  # Also valid
```

### Operators

| Operator | Description |
|----------|-------------|
| `( )` | Logical grouping |
| `[ ]` | Index |
| `.` | Property access |
| `!` | Not |
| `<`, `<=`, `>`, `>=` | Comparison |
| `==`, `!=` | Equality |
| `&&` | And |
| `\|\|` | Or |

### Status Check Functions

| Function | Description |
|----------|-------------|
| `success()` | True if all previous steps succeeded (default) |
| `failure()` | True if any previous step failed |
| `always()` | Always true, runs even if cancelled |
| `cancelled()` | True if workflow was cancelled |

### Common Functions

| Function | Description |
|----------|-------------|
| `contains(search, item)` | True if search contains item |
| `startsWith(string, prefix)` | String starts with prefix |
| `endsWith(string, suffix)` | String ends with suffix |
| `format(string, ...args)` | Format string with args |
| `join(array, separator)` | Join array elements |
| `toJSON(value)` | Convert to JSON string |
| `fromJSON(string)` | Parse JSON string |
| `hashFiles(pattern)` | Hash of matching files |

### Conditional Examples

```yaml
steps:
  # Run only on main branch
  - if: github.ref == 'refs/heads/main'
    run: ./deploy.sh

  # Run on specific event
  - if: github.event_name == 'push'
    run: ./build.sh

  # Run on PR from fork
  - if: github.event.pull_request.head.repo.fork == true
    run: echo "This is a fork PR"

  # Run if previous step failed
  - if: failure()
    run: ./cleanup.sh

  # Run always (even if cancelled)
  - if: always()
    run: ./notify.sh

  # Complex condition
  - if: |
      github.event_name == 'push' &&
      github.ref == 'refs/heads/main' &&
      !contains(github.event.head_commit.message, '[skip ci]')
    run: ./deploy.sh

  # Check for label
  - if: contains(github.event.pull_request.labels.*.name, 'deploy')
    run: ./deploy.sh

  # Run on schedule only
  - if: github.event_name == 'schedule'
    run: ./scheduled-task.sh
```

---

## Contexts

### Available Contexts

| Context | Description |
|---------|-------------|
| `github` | Workflow run info, event payload |
| `env` | Environment variables |
| `vars` | Repository/org variables |
| `job` | Current job info |
| `jobs` | Reusable workflow job outputs |
| `steps` | Step outputs and status |
| `runner` | Runner info |
| `secrets` | Secret values |
| `strategy` | Matrix strategy info |
| `matrix` | Current matrix values |
| `needs` | Dependent job outputs |
| `inputs` | Workflow inputs |

### Common github Context Properties

```yaml
# Event info
github.event_name          # 'push', 'pull_request', etc.
github.event               # Full event payload
github.sha                 # Commit SHA
github.ref                 # 'refs/heads/main', 'refs/pull/1/merge'
github.ref_name            # 'main', '1/merge'
github.head_ref            # PR source branch
github.base_ref            # PR target branch

# Repository info
github.repository          # 'owner/repo'
github.repository_owner    # 'owner'
github.repositoryUrl       # 'git://github.com/owner/repo.git'

# Workflow info
github.workflow            # Workflow name
github.workflow_ref        # Workflow file path
github.run_id              # Unique run ID
github.run_number          # Run number (increments)
github.run_attempt         # Retry attempt number
github.job                 # Current job ID
github.action              # Action name or step ID

# Actor info
github.actor               # User who triggered
github.actor_id            # User ID
github.triggering_actor    # User who caused run

# URLs
github.server_url          # 'https://github.com'
github.api_url             # 'https://api.github.com'
github.graphql_url         # 'https://api.github.com/graphql'

# Token
github.token               # GITHUB_TOKEN
```

### Using Contexts

```yaml
steps:
  - name: Print context info
    run: |
      echo "Event: ${{ github.event_name }}"
      echo "Ref: ${{ github.ref }}"
      echo "SHA: ${{ github.sha }}"
      echo "Actor: ${{ github.actor }}"
      echo "Repository: ${{ github.repository }}"

  - name: Access event payload
    run: |
      echo "PR number: ${{ github.event.pull_request.number }}"
      echo "PR title: ${{ github.event.pull_request.title }}"
      echo "Commit message: ${{ github.event.head_commit.message }}"

  - name: Use step outputs
    id: build
    run: echo "version=1.0.0" >> $GITHUB_OUTPUT

  - name: Reference step output
    run: echo "Version: ${{ steps.build.outputs.version }}"

  - name: Use matrix values
    run: echo "OS: ${{ matrix.os }}, Node: ${{ matrix.node }}"
```

---

## Environment Variables & Secrets

### Setting Environment Variables

```yaml
# Workflow level
env:
  NODE_ENV: production
  CI: true

jobs:
  build:
    # Job level
    env:
      DATABASE_URL: postgres://localhost/test

    steps:
      # Step level
      - run: npm test
        env:
          DEBUG: true
```

### Default Environment Variables

| Variable | Description |
|----------|-------------|
| `CI` | Always `true` |
| `GITHUB_WORKFLOW` | Workflow name |
| `GITHUB_RUN_ID` | Unique run ID |
| `GITHUB_RUN_NUMBER` | Run number |
| `GITHUB_JOB` | Job ID |
| `GITHUB_ACTION` | Action name |
| `GITHUB_ACTOR` | User who triggered |
| `GITHUB_REPOSITORY` | `owner/repo` |
| `GITHUB_EVENT_NAME` | Event name |
| `GITHUB_SHA` | Commit SHA |
| `GITHUB_REF` | Branch/tag ref |
| `GITHUB_HEAD_REF` | PR source branch |
| `GITHUB_BASE_REF` | PR target branch |
| `GITHUB_TOKEN` | Auto-generated token |
| `GITHUB_WORKSPACE` | Workspace directory |
| `RUNNER_OS` | `Linux`, `Windows`, `macOS` |
| `RUNNER_ARCH` | `X86`, `X64`, `ARM`, `ARM64` |

### Setting Dynamic Variables

```yaml
steps:
  # Set for subsequent steps
  - run: echo "VERSION=1.0.0" >> $GITHUB_ENV

  # Use the variable
  - run: echo "Version is $VERSION"

  # Set step output
  - id: vars
    run: echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT

  # Use step output
  - run: echo "Short SHA: ${{ steps.vars.outputs.sha_short }}"

  # Multiline variable
  - run: |
      echo "CHANGELOG<<EOF" >> $GITHUB_ENV
      cat CHANGELOG.md >> $GITHUB_ENV
      echo "EOF" >> $GITHUB_ENV
```

### Using Secrets

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: ./deploy.sh

      - name: Docker login
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
```

### Secret Precedence

1. **Environment secrets** (highest priority)
2. **Repository secrets**
3. **Organization secrets** (lowest priority)

### Repository Variables (vars context)

```yaml
steps:
  - run: echo "App name: ${{ vars.APP_NAME }}"
  - run: echo "API URL: ${{ vars.API_URL }}"
```

---

## Matrix Strategy

### Basic Matrix

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
      - run: npm test
```

### Matrix with Include/Exclude

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        node: [18, 20]
        exclude:
          - os: windows-latest
            node: 18
        include:
          - os: ubuntu-latest
            node: 22
            experimental: true
    runs-on: ${{ matrix.os }}
    continue-on-error: ${{ matrix.experimental || false }}
```

### Matrix Options

```yaml
strategy:
  fail-fast: false              # Don't cancel other jobs if one fails
  max-parallel: 2               # Limit concurrent jobs
  matrix:
    # ...
```

### Dynamic Matrix

```yaml
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          echo "matrix={\"node\":[18,20,22]}" >> $GITHUB_OUTPUT

  test:
    needs: setup
    strategy:
      matrix: ${{ fromJSON(needs.setup.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

---

## Caching

### Basic Caching

```yaml
steps:
  - uses: actions/cache@v4
    with:
      path: ~/.npm
      key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        ${{ runner.os }}-npm-
```

### Cache Paths by Package Manager

| Package Manager | Cache Path |
|-----------------|------------|
| npm | `~/.npm` |
| yarn | `~/.cache/yarn` |
| pnpm | `~/.local/share/pnpm/store` |
| pip | `~/.cache/pip` |
| go | `~/go/pkg/mod` |
| maven | `~/.m2/repository` |
| gradle | `~/.gradle/caches` |

### Caching with setup-node (Automatic)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 20
      cache: 'npm'              # Automatic caching
  - run: npm ci
```

### Advanced Caching Pattern

```yaml
steps:
  - uses: actions/cache@v4
    id: cache
    with:
      path: |
        ~/.npm
        node_modules
      key: deps-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}
      restore-keys: |
        deps-${{ runner.os }}-

  - name: Install dependencies
    if: steps.cache.outputs.cache-hit != 'true'
    run: npm ci
```

### Cache Limits

- Maximum cache size: **10 GB** per repository
- Cache entries older than **7 days** are automatically removed
- Maximum **256 jobs** can be generated by matrix strategy

---

## Artifacts

### Upload Artifacts

```yaml
steps:
  - run: npm run build

  - uses: actions/upload-artifact@v4
    with:
      name: build-output
      path: dist/
      retention-days: 5           # Default: 90
      if-no-files-found: error    # 'warn' or 'ignore'
```

### Download Artifacts

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - run: ./deploy.sh dist/
```

### Download All Artifacts

```yaml
steps:
  - uses: actions/download-artifact@v4
    with:
      path: artifacts/
      pattern: build-*           # Download matching artifacts
      merge-multiple: true       # Merge into single directory
```

---

## Reusable Workflows

### Define Reusable Workflow

```yaml
# .github/workflows/reusable-build.yml
name: Reusable Build

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      environment:
        required: false
        type: string
        default: 'development'
    secrets:
      npm-token:
        required: true
    outputs:
      artifact-name:
        description: "Name of the uploaded artifact"
        value: ${{ jobs.build.outputs.artifact-name }}

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact-name: ${{ steps.upload.outputs.artifact-name }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
        env:
          NODE_AUTH_TOKEN: ${{ secrets.npm-token }}
      - run: npm run build
      - id: upload
        uses: actions/upload-artifact@v4
        with:
          name: build-${{ inputs.environment }}
          path: dist/
```

### Call Reusable Workflow

```yaml
# .github/workflows/main.yml
name: Main CI

on:
  push:
    branches: [main]

jobs:
  build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: '20'
      environment: 'production'
    secrets:
      npm-token: ${{ secrets.NPM_TOKEN }}

  # Or from another repository
  external-build:
    uses: owner/repo/.github/workflows/build.yml@main
    with:
      node-version: '20'
```

### Matrix with Reusable Workflows

```yaml
jobs:
  build:
    strategy:
      matrix:
        environment: [dev, staging, prod]
    uses: ./.github/workflows/reusable-build.yml
    with:
      node-version: '20'
      environment: ${{ matrix.environment }}
    secrets: inherit              # Pass all secrets
```

---

## Concurrency

### Basic Concurrency

```yaml
# Workflow level
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# Job level
jobs:
  deploy:
    concurrency:
      group: deploy-${{ github.ref }}
      cancel-in-progress: false
```

### Common Patterns

```yaml
# Cancel duplicate PR builds
concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true

# Environment-based (no duplicate deploys)
concurrency:
  group: deploy-${{ github.event.inputs.environment }}
  cancel-in-progress: false

# Branch-specific
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}
```

### Timeout Settings

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30           # Job timeout (default: 360)
    steps:
      - run: npm test
        timeout-minutes: 10       # Step timeout
```

---

## Permissions & Security

### GITHUB_TOKEN Permissions

```yaml
permissions:
  actions: read|write|none
  checks: read|write|none
  contents: read|write|none
  deployments: read|write|none
  id-token: read|write|none
  issues: read|write|none
  packages: read|write|none
  pages: read|write|none
  pull-requests: read|write|none
  repository-projects: read|write|none
  security-events: read|write|none
  statuses: read|write|none
```

### Minimal Permissions (Recommended)

```yaml
# Workflow level - restrict all
permissions:
  contents: read

# Job level - expand as needed
jobs:
  release:
    permissions:
      contents: write
      packages: write
```

### Common Permission Patterns

```yaml
# Read-only checkout
permissions:
  contents: read

# Create releases
permissions:
  contents: write

# Comment on PRs
permissions:
  pull-requests: write

# Push packages
permissions:
  packages: write

# Deploy to GitHub Pages
permissions:
  pages: write
  id-token: write

# CodeQL analysis
permissions:
  security-events: write
  contents: read
```

### Security Best Practices

1. **Least Privilege**: Only grant permissions that are needed
2. **Pin Actions**: Use full SHA instead of tags
   ```yaml
   uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
   ```
3. **Review Third-Party Actions**: Audit code before using
4. **Protect Secrets**: Never log or expose secrets
5. **Use Environments**: Require approvals for production deployments
6. **Avoid `pull_request_target`**: Be careful with fork PRs

### Environment Protection Rules

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - run: ./deploy.sh
```

---

## Popular Actions

### Official GitHub Actions (December 2025)

| Action | Version | Description |
|--------|---------|-------------|
| `actions/checkout` | v4 | Check out repository |
| `actions/setup-node` | v4 | Set up Node.js |
| `actions/setup-python` | v5 | Set up Python |
| `actions/setup-java` | v4 | Set up Java |
| `actions/setup-go` | v5 | Set up Go |
| `actions/cache` | v4 | Cache dependencies |
| `actions/upload-artifact` | v4 | Upload artifacts |
| `actions/download-artifact` | v4 | Download artifacts |
| `actions/github-script` | v7 | Run GitHub API scripts |

### Popular Third-Party Actions

| Action | Description |
|--------|-------------|
| `docker/build-push-action` | Build and push Docker images |
| `docker/login-action` | Docker registry login |
| `github/codeql-action` | Security scanning |
| `softprops/action-gh-release` | Create GitHub releases |
| `peaceiris/actions-gh-pages` | Deploy to GitHub Pages |
| `codecov/codecov-action` | Code coverage |
| `peter-evans/create-pull-request` | Create PRs programmatically |
| `actions-rs/toolchain` | Rust toolchain setup |

---

## Best Practices

### Workflow Organization

```yaml
# Use descriptive names
name: CI/CD Pipeline

# Group related jobs
jobs:
  lint:
    name: Lint & Format
  test:
    name: Run Tests
  build:
    name: Build Application
  deploy:
    name: Deploy to Production
```

### Performance

1. **Use caching** for dependencies
2. **Run jobs in parallel** when possible
3. **Use matrix** for multi-platform testing
4. **Set appropriate timeouts**
5. **Use `ubuntu-latest`** for fastest startup
6. **Minimize checkout depth**
   ```yaml
   - uses: actions/checkout@v4
     with:
       fetch-depth: 1
   ```

### Maintainability

1. **Use reusable workflows** for common patterns
2. **Use composite actions** for repeated steps
3. **Document workflows** with comments
4. **Use consistent naming** conventions
5. **Version pin** all actions

### Cost Optimization

1. **Cancel redundant runs** with concurrency
2. **Skip unnecessary jobs** with path filters
3. **Use `ubuntu-slim`** for lightweight tasks
4. **Limit matrix combinations**
5. **Set cache TTL** appropriately

### Complete Example

```yaml
name: CI/CD

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

concurrency:
  group: ${{ github.workflow }}-${{ github.head_ref || github.run_id }}
  cancel-in-progress: true

env:
  NODE_VERSION: '20'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: 'npm'
      - run: npm ci
      - run: npm test

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
      - run: ./deploy.sh
```

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax Reference](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Events Reference](https://docs.github.com/en/actions/reference/events-that-trigger-workflows)
- [Contexts Reference](https://docs.github.com/en/actions/reference/contexts)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides)
