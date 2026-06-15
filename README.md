# Snyk Dynamic Plugin for Janus IDP

This Backstage monorepo converts the upstream [backstage-plugin-snyk][upstream-plugin] into a dynamic
plugin for [Janus IDP][janus-idp]. The plugin displays Snyk security vulnerabilities, license
issues, and dependency graphs within the Backstage catalog.

The primary deliverable is a packaged dynamic plugin tarball
(`backstage-plugin-snyk-<version>.tgz`) that Janus IDP loads at runtime without rebuilding the main
Backstage application.

> **Note:** This repo includes patch files that fix Webpack 5 compatibility issues in upstream
> dependencies. They are applied automatically during `yarn install`.

## Prerequisites

- Node.js 22 or 24
- Yarn 4.4.1 (included in `.yarn/releases/`)
- A Snyk API token (service account with Viewer permission at group level is recommended)

## Getting Started

```sh
yarn install
yarn start
```

This starts the Backstage app and backend in development mode. The app is available at
`http://localhost:3000` and the backend at `http://localhost:7007`.

To use the plugin with live Snyk data, set the `SNYK_TOKEN` environment variable:

```sh
export SNYK_TOKEN="<your-snyk-api-token>"
```

Alternatively, set `snyk.mocked: true` in `app-config.yaml` to use static mock data without a Snyk
account.

## Workspace Layout

| Directory | Description |
|-----------|-------------|
| `plugins/backstage-plugin-snyk/` | Core Snyk plugin (frontend-only) — the main deliverable |
| `packages/app/` | Backstage frontend shell for development/testing |
| `packages/backend/` | Backstage backend with proxy endpoint for Snyk API |
| `examples/` | Sample catalog YAML files with Snyk annotations |

## Building the Dynamic Plugin

The `build` script packages the plugin for deployment to Janus IDP:

```sh
./build
```

This runs `janus-cli package export-dynamic-plugin`, creates a tarball via `npm pack`, and prints
the SHA-256 integrity hash needed for Janus IDP configuration.

The output tarball (`backstage-plugin-snyk-<version>.tgz`) is placed in the repository root.

### Manual Build Steps

```sh
cd plugins/backstage-plugin-snyk/
npx janus-cli package export-dynamic-plugin
npm pack ./dist-dynamic
```

## Development

### Type Checking

```sh
yarn tsc          # Standard type check (skipLibCheck: true)
yarn tsc:full     # Strict type check (skipLibCheck: false)
```

### Linting and Formatting

```sh
yarn lint         # Run ESLint across all workspaces
yarn prettier:check  # Check formatting
yarn fix          # Auto-fix lint and formatting issues
```

### Testing

```sh
yarn test         # Run unit tests (Jest)
yarn test:all     # Run all tests with coverage
yarn test:e2e     # Run end-to-end tests (Playwright)
```

### Building

```sh
yarn build:all     # Build all packages
yarn build:backend # Build backend only (for Docker)
```

### Docker

```sh
yarn install --immutable
yarn tsc
yarn build:backend
yarn build-image   # Builds Docker image tagged "backstage"
```

## Plugin Configuration

The plugin requires a Backstage proxy endpoint for Snyk API access. Add to `app-config.yaml`:

```yaml
proxy:
  endpoints:
    /snyk:
      target: https://api.snyk.io/
      headers:
        User-Agent: tech-services/backstage-plugin/1.0
        Authorization: token ${SNYK_TOKEN}
```

For EU or AU Snyk accounts, change the target to `https://api.eu.snyk.io/` or
`https://api.au.snyk.io/`.

Optional configuration:

```yaml
snyk:
  appHost: app.snyk.io          # Snyk web UI hostname (default: app.snyk.io)
  # apiVersion: 2024-02-28      # REST API version (default: 2024-02-28)
  # issuesApiVersion: 2024-01-23 # Issues API version (default: 2024-01-23)
  mocked: false                  # Use mock data instead of live API (default: false)
  showResolvedInGraphs: false    # Show resolved issues in graphs (default: false)
```

## Entity Annotations

Add Snyk annotations to your Backstage catalog entities:

```yaml
metadata:
  annotations:
    snyk.io/org-id: "<your-snyk-org-id>"
    # Use one or more of the following to identify targets/projects:
    snyk.io/targets: "org/repo"
    snyk.io/project-ids: "<project-uuid>"
    snyk.io/target-id: "<target-name-or-uuid>"
    # Optional: exclude specific projects
    snyk.io/exclude-project-ids: "<project-uuid>"
```

For multi-org setups, use `snyk.io/org-ids` (comma-separated) instead of `snyk.io/org-id`.

See `examples/` for sample catalog entity files and the [plugin documentation][plugin-readme] for
full annotation reference.

## Architecture

See the [architecture documentation][architecture] for internal design decisions, data flow, and
dependency points.

## License

[Apache-2.0][license]

[upstream-plugin]: https://github.com/snyk-tech-services/backstage-plugin-snyk
[janus-idp]: https://janus-idp.io/
[plugin-readme]: plugins/backstage-plugin-snyk/README.md
[architecture]: ARCHITECTURE.md
[license]: plugins/backstage-plugin-snyk/LICENSE
