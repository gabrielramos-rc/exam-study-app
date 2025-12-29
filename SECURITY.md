# Security Policy

## Reporting Security Issues

If you discover a security vulnerability in this project, please report it by opening a GitHub issue or contacting the maintainers directly. For sensitive issues, please do not disclose details publicly until a fix has been released.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Known Dependency Risks

### PostgreSQL Client Dependencies (pg)

**Assessment Date:** December 2024

This application uses Prisma 7 with `@prisma/adapter-pg` and the `pg` package for PostgreSQL connectivity. OpenSSF Scorecard analysis has identified quality/maintenance concerns in transitive dependencies within the `pg` dependency tree:

| Package   | OpenSSF Score | Status                    |
| --------- | ------------- | ------------------------- |
| pg-pool   | 2.3           | Archived repository       |
| pg-int8   | 2.9           | Not actively maintained   |
| pgpass    | 3.2           | Limited maintenance       |

**Risk Assessment:**

- These are **informational warnings** about code quality metrics, not known security vulnerabilities
- The packages are transitive dependencies of `pg`, which is required by Prisma's PostgreSQL adapter
- The `pg` package itself (brianc/node-postgres) remains actively maintained
- No alternative exists for Prisma 7's PostgreSQL driver adapter pattern

**Mitigation:**

- Dependencies are pinned to specific versions via package-lock.json
- Regular `npm audit` checks are performed during CI
- Prisma ORM provides an abstraction layer that limits direct exposure to these packages
- This is a single-user, self-hosted application with no external network exposure

**Prisma Dependency Tree:**

The Prisma ecosystem shows existing vulnerabilities in its broader dependency tree. These are tracked upstream and will be addressed as Prisma releases updates.

### Monitoring

We monitor these dependencies through:
- GitHub Dependabot alerts
- npm audit in CI pipeline
- Periodic review of OpenSSF Scorecard reports

## Security Best Practices

When deploying this application:

1. **Database credentials**: Use Kubernetes secrets, not plaintext in manifests
2. **Network isolation**: Run in a private namespace with no external ingress
3. **Image scanning**: Scan container images before deployment
4. **Updates**: Keep Node.js, Prisma, and base images updated
