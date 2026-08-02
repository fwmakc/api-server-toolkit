# Contributing to api-server-toolkit

Thanks for your interest in contributing! This is the shared framework library for the
[fwmakc microservices stack](https://github.com/fwmakc/gateway-server).

## Prerequisites

- **Node.js** 20+ (`node -v`)
- **npm** 10+
- **PostgreSQL** 14+ (for test suite — uses real DB, not mocks)

## Development Setup

```bash
git clone https://github.com/fwmakc/api-server-toolkit.git
cd api-server-toolkit
npm install
```

### Linking to local services

To test changes against local services without publishing:

```bash
# In api-server-toolkit:
npm run build
npm link

# In any service (e.g. auth-server):
npm link api-server-toolkit
```

Or use the stack-level script: `link-toolkit.ps1` from the `servers/` root.

## Testing

```bash
npm test
```

8 test suites, 111 tests. Tests use real PostgreSQL with `dropSchema: true` +
`synchronize: true` for clean state. Ensure `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD` are set (or use `.env`).

## Building

```bash
npm run build
```

Output goes to `dist/`. The `dist/` directory is consumed by all services via
`github:fwmakc/api-server-toolkit#v2.1.0`.

## Code Style

- TypeScript with strict type checking
- Factory functions for TypeORM columns (`IdColumn`, `VarcharColumn`, etc.)
- NestJS conventions (modules, providers, guards, interceptors)
- No comments in code unless absolutely necessary
- See `AGENTS.md` for detailed conventions

## Pull Request Process

1. Fork the repo, create a branch from `master`
2. Make your changes
3. Ensure tests pass: `npm test`
4. Ensure build succeeds: `npm run build`
5. If adding new exports, update `ai-declarations.md` (`npm run ai-declarations`)
6. Create a pull request with a clear description

## Adding New Toolkit Features

Before creating any column, decorator, guard, service, or helper:

```bash
# Search for existing implementations first
grep -r "Column\|Guard\|Service\|Helper" src/
```

See `AGENTS.md` for the full catalog of existing exports.
