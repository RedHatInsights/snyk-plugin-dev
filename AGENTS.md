# snyk-plugin-dev

## Project Overview

Backstage monorepo that converts the upstream [backstage-plugin-snyk][upstream-plugin] into a dynamic
plugin for [Janus IDP][janus-idp]. The plugin displays Snyk security vulnerabilities, license
issues, and dependency graphs within the Backstage catalog. The primary deliverable is a packaged
dynamic plugin tarball (`backstage-plugin-snyk-<version>.tgz`) built via the Janus IDP CLI.

## Dependencies

- **Runtime:** Node.js 22 or 24, Yarn 4.4.1 (included in `.yarn/releases/`)
- **Frontend:** React 18, TypeScript 5.8, Material-UI v5, Backstage 0.35.4
- **Key libraries:** `@snyk/dep-graph`, `react-circular-progressbar`, `react-use`
- **Build tooling:** Backstage CLI (`@backstage/cli`), Janus IDP CLI (`@janus-idp/cli`)
- **Testing:** Jest 30.2.0, Playwright 1.32.3, MSW 2.0.5
- **CI:** CircleCI with Snyk orb for security scanning, semantic-release for versioning

## Development Commands

See [development setup in the README][readme-dev] for the full command reference.

```sh
yarn install          # Install dependencies (applies patches automatically)
yarn start            # Start app + backend in dev mode
yarn tsc              # Type-check all workspaces
yarn lint             # ESLint across all workspaces
yarn prettier:check   # Check formatting
yarn fix              # Auto-fix lint and formatting
yarn test             # Unit tests (Jest)
yarn test:all         # All tests with coverage
yarn test:e2e         # E2E tests (Playwright)
yarn build:all        # Build all packages
./build               # Package dynamic plugin tarball with integrity hash
```

CI runs `yarn install`, `yarn tsc`, and `snyk scan` (high severity threshold) on all branches.
On `main`, it additionally runs `snyk monitor` and `semantic-release`.

## Architecture

Three Yarn workspaces: `plugins/backstage-plugin-snyk/` (core frontend plugin — the deliverable),
`packages/app/` (Backstage dev shell), `packages/backend/` (backend with Snyk proxy endpoint).
The plugin entry point is `plugins/backstage-plugin-snyk/src/plugin.ts`, which registers
`SnykApiClient` and two extensions (`EntitySnykContent`, `SnykOverview`). All Snyk API calls are
proxied through the Backstage backend (`/api/proxy/snyk` → `api.snyk.io`).

See the [architecture documentation][architecture] for design decisions, data flow, and dependency
details.

## Code Style

- **Linter:** ESLint with `@backstage/cli` config (extends Backstage defaults)
- **Formatter:** Prettier via `@backstage/cli/config/prettier`
- **TypeScript:** Strict mode, `tsconfig.json` at root and per-package
- **lint-staged** is configured in root `package.json` for `*.{js,jsx,ts,tsx,mjs,cjs}` (ESLint +
  Prettier) and `*.{json,md}` (Prettier), but no pre-commit hook runner (husky/lefthook) is
  installed — linting is CI-enforced only

## Common Mistakes

1. **Using `yarn workspace` for dynamic plugin export.** The `build` script uses `npx janus-cli`
   directly inside the plugin directory rather than `yarn workspace backstage-plugin-snyk
   export-dynamic`. Running via `yarn workspace` causes a `backstage-plugin-snyk@workspace:.`
   lockfile resolution error. Always use `./build` from the repo root or `cd` into the plugin
   directory and run `npx` directly.

2. **Assuming immutable installs during export.** The `build` script sets
   `YARN_ENABLE_IMMUTABLE_INSTALLS=false` because `janus-cli` modifies `yarn.lock` internally.
   Do not add `--immutable` flags when running the dynamic plugin export.

3. **Editing `app-config.production.yaml` without caution.** This file contains the Snyk API token
   configuration (`Authorization: token ${SNYK_TOKEN}`). It is not checked into the repo. The
   development config in `app-config.yaml` does not include the token header — the backend proxy
   won't forward authenticated requests unless the production config is loaded.

4. **Confusing V1 and V3 Snyk API endpoints.** The plugin uses both REST API versions: V3
   (`/rest/orgs/...`) for issues, targets, and projects, and V1 (`/v1/org/...`) for project details
   and dependency graphs. They use different content types (`application/vnd.api+json` vs
   `application/json`) and different path patterns. See `SnykApiClient.ts` for the mapping.

5. **Ignoring the `.snyk` policy file.** The file at `plugins/backstage-plugin-snyk/.snyk` contains
   vulnerability ignore rules with expired dates (2021–2022). These ignores are no longer in effect
   but the file is still read by the Snyk CLI during CI scans.

## Testing

- **Unit tests:** Jest 30.2.0 with `@jest/environment-jsdom-abstract`. Run `yarn test` or
  `yarn test:all --coverage`. Tests use MSW (Mock Service Worker) for API mocking.
- **E2E tests:** Playwright 1.32.3. Run `yarn test:e2e`. Configuration in `playwright.config.ts`
  supports both CI and local dev server modes.
- Test files are colocated with source files in the plugin directory.

## Deployment

The dynamic plugin is deployed to Janus IDP instances. Run `./build` to produce the tarball and
integrity hash. The tarball is loaded by Janus IDP's Scalprum-based dynamic plugin system at
runtime. The backend can also be containerized via `packages/backend/Dockerfile` (see the
[Docker build steps in the README][readme-docker]).

[upstream-plugin]: https://github.com/snyk-tech-services/backstage-plugin-snyk
[janus-idp]: https://janus-idp.io/
[readme-dev]: README.md#development
[architecture]: ARCHITECTURE.md
[readme-docker]: README.md#docker
