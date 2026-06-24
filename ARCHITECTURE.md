# Architecture

This document describes the internal architecture of the Snyk dynamic plugin for Backstage/Janus IDP, its design decisions, and implementation details.

## System Overview

This monorepo converts the [upstream backstage-plugin-snyk][upstream-plugin] into a dynamic plugin compatible with Janus IDP. It is a Backstage-based application that integrates Snyk security scanning into the Backstage catalog, displaying vulnerability data, license issues, and dependency graphs for cataloged components.

The primary deliverable is `plugins/backstage-plugin-snyk/`, packaged as a dynamic plugin tarball via the Janus IDP CLI. The repository includes a minimal Backstage application (`packages/app/` and `packages/backend/`) to support development and testing.

## Workspace Structure

The repository uses Yarn 4.4.1 workspaces with the following layout:

- **`plugins/backstage-plugin-snyk/`** — The core plugin (frontend-only). This is the main deliverable. Exports two components (`EntitySnykContent`, `SnykOverview`) and an API client (`SnykApiClient`) that communicates with Snyk's REST API via a Backstage proxy.

- **`packages/app/`** — Backstage frontend shell. Integrates the Snyk plugin into entity pages for development/testing. Not shipped with the dynamic plugin.

- **`packages/backend/`** — Backstage backend. Provides the `/snyk` proxy endpoint (configured in `app-config.yaml`) that forwards requests to `https://api.snyk.io`. Not shipped with the dynamic plugin.

- **`examples/`** — Sample catalog YAML files demonstrating Snyk annotations (`snyk.io/org-id`, `github.com/project-slug`, etc.). Used for local testing.

- **`build`** — Shell script that packages the dynamic plugin. Runs `janus-cli package export-dynamic-plugin` inside the plugin directory, then creates a tarball with `npm pack`. Outputs integrity hash for deployment.

## Plugin Architecture

### Entry Points

The plugin is defined in `plugins/backstage-plugin-snyk/src/plugin.ts`:

```typescript
export const backstagePluginSnykPlugin = createPlugin({
  id: "backstage-plugin-snyk",
  apis: [
    createApiFactory({
      api: snykApiRef,
      deps: { discoveryApi, configApiRef, fetchApi },
      factory: ({ discoveryApi, configApiRef, fetchApi }) =>
        new SnykApiClient({ discoveryApi, configApi: configApiRef, fetchApi }),
    }),
  ],
  routes: {
    entityContent: entityContentRouteRef,
  },
});
```

This registers:
- A plugin factory with ID `backstage-plugin-snyk`
- An API implementation (`SnykApiClient`) registered under `snykApiRef`
- A routable route (`entityContent`) for mounting in entity pages

Two extension points are exported:

1. **`EntitySnykContent`** (routable extension) — Full-page view with tabs for multiple projects. Mounted at `/snyk` in entity pages. Lazy-loads `SnykEntityComponent`.

2. **`SnykOverview`** (component extension) — Compact card for overview pages. Lazy-loads `SnykOverview`.

### API Layer

`plugins/backstage-plugin-snyk/src/api/SnykApiClient.ts` implements the `SnykApi` interface. Key responsibilities:

- **Proxy resolution**: Uses Backstage's `DiscoveryApi` to resolve the backend proxy URL (`/api/proxy/snyk`), which forwards to `api.snyk.io`.

- **Authentication**: Injects a `User-Agent` header (`tech-services/backstage-plugin/<version>`) and expects the backend proxy to add the Snyk API token via proxy configuration (`app-config.yaml`).

- **API versioning**: Reads `snyk.apiVersion` (default `2024-02-28`) and `snyk.issueApiVersion` (default `2024-01-23`) from Backstage config. V3 endpoints use `application/vnd.api+json` content type; V1 endpoints use `application/json`.

- **Mocked mode**: If `snyk.mocked` is true, returns static test data from `src/utils/mocked*.ts` instead of making network calls.

Key methods:

- `getCompleteProjectsListFromAnnotations(orgId, annotations, ignoreMissingTargets)` — Main entry point. Parses entity annotations (`snyk.io/targets`, `snyk.io/project-ids`, etc.) and resolves them to Snyk project IDs. Supports multiple annotation formats and exclusion lists (`snyk.io/exclude-project-ids`).

- `listAllAggregatedIssues(orgId, projectId)` — Fetches vulnerability and license issues via `/rest/orgs/{orgId}/issues?scan_item.id={projectId}`. Returns unified issue format (V3 API).

- `getProjectDetails(orgId, projectId)` — Fetches project metadata via `/v1/org/{orgName}/project/{projectId}` (V1 API). Returns project name, origin, type, last test date, etc.

- `getDependencyGraph(orgId, projectId)` — Fetches dependency graph via `/v1/org/{orgName}/project/{projectId}/dep-graph` (V1 API). Only called for package vulnerability issues.

- `getOrgSlug(orgId)` — Resolves organization ID to slug via `/rest/orgs/{orgId}`. Used to construct Snyk web UI links.

### Component Hierarchy

**Root component: `SnykEntityComponent`** (`plugins/backstage-plugin-snyk/src/components/SnykEntityComponent/SnykEntityComponent.tsx`)

- Checks if the plugin is applicable via `snykApi.isAvailableInEntity(entity)` (requires org + target/project annotations).
- Fetches project lists for all annotated org IDs in parallel.
- Renders `TabbedLayout` with one tab per project.
- Each tab displays an icon based on project origin (GitHub, GitLab, Bitbucket, CLI, etc.).
- Tab content is generated by `generateSnykTabForProject(snykApi, orgId, orgSlug, projectId)`.

**Tab generator: `generateSnykTabForProject`** (`plugins/backstage-plugin-snyk/src/components/SnykEntityComponent/SnykTab.tsx`)

- Returns a functional component that fetches:
  1. All aggregated issues via `listAllAggregatedIssues`
  2. Project details via `getProjectDetails`
  3. Dependency graph via `getDependencyGraph` (if package vulnerabilities exist)
- Separates issues into three categories:
  - **Generic issues** (all types except license)
  - **License issues** (type `license`)
  - **Ignored issues** (filtered by `ignored === true`)
- Renders a grid layout with:
  - **Metadata card** (`StructuredMetadataTable`) — origin, type, created date, last tested, project ID, organization
  - **Counter cards** (`SnykCounter`) — vulnerability/license/ignored issue counts by severity (critical/high/medium/low)
  - **Tabbed card** — Issues, License Issues, Dependencies (if available), Ignored

**Sub-components:**

- `SnykCounter` (`plugins/backstage-plugin-snyk/src/components/SnykEntityComponent/components/SnykCountersComponent.tsx`) — Displays circular progress bars for critical/high/medium/low severity counts.

- `IssuesTable` (`plugins/backstage-plugin-snyk/src/components/SnykEntityComponent/components/SnykIssuesComponent.tsx`) — Displays issue list in a table (ID, title, severity, status, type, links to Snyk UI).

- `DepGraphInfo` (`plugins/backstage-plugin-snyk/src/components/SnykEntityComponent/components/SnykDepGraphComponent.tsx`) — Renders dependency graph visualization using `@snyk/dep-graph`.

**Overview component: `SnykOverview`** (`plugins/backstage-plugin-snyk/src/components/SnykEntityComponent/SnykOverviewComponent.tsx`)

- Compact card for overview pages (not entity detail pages).
- Displays aggregated counts across all projects in an entity.
- Uses the same API methods but sums results.

### State Management

The plugin uses **no global state**. All state is component-local via React hooks:

- `useEntity()` — Retrieves the current Backstage catalog entity from context.
- `useApi(snykApiRef)` — Retrieves the `SnykApiClient` instance.
- `useAsync()` (from `react-use`) — Manages async data fetching with loading/error/value states.

Data flow:
1. Component mounts → `useAsync` triggers API calls
2. API calls go through `SnykApiClient` → Backstage proxy → Snyk REST API
3. Response data is stored in component state via `useAsync`
4. Re-renders display the fetched data

### Routing

The plugin registers a single route reference (`entityContentRouteRef`) with ID `snyk`. This route is mounted in entity pages at `/snyk` (see `packages/app/src/components/catalog/EntityPage.tsx`).

The `isSnykAvailable` guard (exported from the plugin as `isPluginApplicableToEntity`) checks for required annotations before displaying the tab.

## Dynamic Plugin Export Mechanism

The plugin is converted to a Janus IDP dynamic plugin using the `@janus-idp/cli` tool.

### Build Process

The `build` script performs:

1. **Export to dynamic format**: Runs `janus-cli package export-dynamic-plugin` in the plugin directory. This:
   - Compiles the plugin using Backstage CLI
   - Generates Webpack 5-compatible bundles in `dist-scalprum/` (Scalprum is Janus IDP's dynamic plugin loader)
   - Creates a `dist-dynamic/` directory with plugin metadata

2. **Package tarball**: Runs `npm pack ./dist-dynamic` to create a `.tgz` file containing:
   - `dist/` — Standard Backstage plugin build (ESM)
   - `dist-scalprum/` — Dynamic plugin bundle
   - `dist-dynamic/` — Metadata for dynamic loading
   - `package.json` with updated `files` field pointing to all three directories

3. **Integrity hash**: Computes SHA-256 checksum in base64 format (`sha256-<base64>`) for use in Janus IDP's dynamic plugin configuration.

### Known Compatibility Issues

The repository includes patch files (applied via `yarn install`) to fix Webpack 5 compatibility issues in upstream dependencies.

## Data Flow

### Entity Annotation Parsing

When a catalog entity has Snyk annotations, the flow is:

1. **Entity YAML** (e.g., `examples/entities.yaml`):
   ```yaml
   metadata:
     annotations:
       snyk.io/org-id: "a5f0f7e5-8f25-4ea8-8e1d-3c0b5f0f7e5"
       github.com/project-slug: "org/repo"
   ```

2. **Annotation resolution** (`SnykApiClient.getCompleteProjectsListFromAnnotations`):
   - Parses `snyk.io/targets`, `snyk.io/project-ids`, `github.com/project-slug`, `snyk.io/target-id`
   - Resolves target names to target IDs via `/rest/orgs/{orgId}/targets?display_name={name}`
   - Fetches project lists via `/rest/orgs/{orgId}/projects?target_id={id}` or `?ids={projectId}`
   - Excludes projects listed in `snyk.io/exclude-project-ids`

3. **Project data fetching** (per project):
   - Issues: `/rest/orgs/{orgId}/issues?scan_item.id={projectId}&scan_item.type=project`
   - Details: `/v1/org/{orgName}/project/{projectId}`
   - Dep graph: `/v1/org/{orgName}/project/{projectId}/dep-graph` (conditional)

4. **Rendering**: Components display aggregated data in tables, counters, and graphs.

### Proxy Flow

All API calls are proxied through the Backstage backend to avoid CORS issues and centralize token management:

```
Plugin (frontend)
  → SnykApiClient.fetch("/api/proxy/snyk/rest/orgs/...")
  → Backstage backend proxy (app-config.yaml: proxy.endpoints./snyk)
  → https://api.snyk.io/rest/orgs/...
```

The backend proxy adds the `Authorization` header from `app-config.production.yaml` (not checked into the repo).

### Issue Filtering

Issues are filtered client-side based on:

- **Severity levels**: Critical, high, medium, low (via `effective_severity_level` attribute)
- **Ignored status**: `attributes.ignored === true`
- **Resolved status**: `attributes.status === "resolved"` (only shown if `snyk.showResolvedInGraphs` is true)

The `getIssuesCount()` and `getIgnoredIssuesCount()` methods in `SnykApiClient` perform this filtering.

## Configuration Model

Configuration is defined in `plugins/backstage-plugin-snyk/config.d.ts` and consumed via Backstage's `ConfigApi`.

### Supported Options

All options are frontend-visible and optional:

- **`snyk.appHost`** (or `snyk.AppHost` for backward compatibility) — Snyk web UI hostname. Default: `app.snyk.io`. Used to construct "More details" links.

- **`snyk.apiVersion`** — Snyk REST API version for org/project/target endpoints. Default: `2024-02-28`.

- **`snyk.issuesApiVersion`** — Snyk REST API version for issues endpoints. Default: `2024-01-23`.

- **`snyk.mocked`** — Boolean. If true, returns static mock data instead of calling the API.

- **`snyk.showResolvedInGraphs`** — Boolean. If true, includes resolved issues in dependency graphs. Default: false.

### Proxy Configuration

The backend proxy is configured in `app-config.yaml`:

```yaml
proxy:
  endpoints:
    /snyk:
      target: https://api.snyk.io
      changeOrigin: true
      # Production config (app-config.production.yaml):
      # headers:
      #   Authorization: ${SNYK_TOKEN}
```

This is required for the plugin to function. The frontend cannot call Snyk APIs directly due to CORS restrictions.

## Key Design Decisions

### Frontend-Only Plugin

The plugin has no backend component beyond the proxy. All business logic (annotation parsing, issue filtering, link construction) is in the frontend. This simplifies dynamic plugin packaging but means:

- No server-side caching of Snyk API responses
- No rate limiting enforcement
- Token management relies on proxy configuration

**Tradeoff**: Simpler architecture, but higher API usage and potential rate limiting issues for large deployments.

### Multi-Org Support

The plugin supports multiple Snyk organizations per entity via `snyk.io/org-ids` (comma-separated). This was added to support monorepos or shared services monitored by multiple orgs.

**Implementation**: Fetches projects in parallel for each org, then merges results. Uses `hasMultipleOrgs` flag to include org slug in tab names (`{orgSlug}/{projectName}`) to avoid collisions.

**Tradeoff**: More network requests but better support for complex org structures.

### Target ID Auto-Resolution

The plugin accepts both target names (`github.com/project-slug`) and target UUIDs (`snyk.io/target-id`). If a name is provided, it resolves to a UUID via the `/rest/orgs/{orgId}/targets` endpoint.

**Tradeoff**: More flexible (users don't need to find UUIDs manually) but adds an extra API call per target.

### Issue Filtering in Frontend

Issues are fetched in bulk via the `/issues` endpoint, then filtered client-side by severity, ignored status, and resolved status.

**Tradeoff**: Simpler API calls but higher bandwidth usage (fetches all issues even if only showing critical/high).

### API Version Pinning

The plugin defaults to specific Snyk API versions (`2024-02-28`, `2024-01-23`) rather than using "latest". This is configured per deployment.

**Rationale**: Snyk's REST API is versioned and breaking changes are common. Pinning versions prevents unexpected breakage.

### Mock Data for Testing

The plugin includes static mock data (`src/utils/mocked*.ts`) that is returned when `snyk.mocked` is true. This allows development without Snyk credentials and faster iteration.

**Tradeoff**: Mock data may drift from real API responses over time.

## Dependency Points

### External Services

- **Snyk REST API** (`api.snyk.io`):
  - `/rest/orgs/{orgId}/targets` — Resolve target names to IDs
  - `/rest/orgs/{orgId}/projects` — Fetch project lists
  - `/rest/orgs/{orgId}/issues` — Fetch vulnerability and license issues
  - `/rest/orgs/{orgId}` — Fetch organization metadata
  - `/v1/org/{orgName}/project/{projectId}` — Fetch project details
  - `/v1/org/{orgName}/project/{projectId}/dep-graph` — Fetch dependency graph

- **Snyk Web UI** (`app.snyk.io` or custom host) — Used for "More details" links to issue details and project pages.

### Internal Dependencies

- **Backstage APIs**: `DiscoveryApi`, `ConfigApi`, `FetchApi`, `EntityProvider` (context)
- **Material-UI v5** — All UI components use `@mui/material` and `@material-ui/core` (v4 compatibility layer)
- **React Router v6** — Routing for entity tabs
- **`@snyk/dep-graph`** — Dependency graph visualizations
- **`react-circular-progressbar`** — Circular progress bars for severity counts

### Build-Time Dependencies

- **Backstage CLI** (`@backstage/cli`) — Builds plugin, runs dev server, handles TypeScript compilation
- **Janus IDP CLI** (`@janus-idp/cli`) — Converts plugin to dynamic format
- **Webpack 5** (via Backstage CLI and Janus CLI) — Bundles frontend code
- **Yarn 4.4.1** — Workspace management, dependency resolution

## Security Considerations

- **Snyk API Token**: Stored in backend configuration (`app-config.production.yaml`), never exposed to frontend.
- **CORS**: Enforced by Backstage backend proxy. Frontend cannot call Snyk APIs directly.
- **Catalog Annotations**: No validation of org IDs or project IDs. Malicious annotations could trigger excessive API calls or enumerate valid Snyk org IDs.
- **Error Handling**: API errors are displayed to users but do not leak sensitive data (error messages are generic).

[upstream-plugin]: https://github.com/snyk-tech-services/backstage-plugin-snyk
