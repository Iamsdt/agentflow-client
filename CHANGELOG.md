# Changelog

All notable changes to `@10xscale/agentflow-client` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Compatibility policy

- **Nothing public is removed without a deprecation cycle.** Anything exported from
  `src/index.ts` is public API. A public export is first marked deprecated with a
  `@deprecated` JSDoc tag, kept working for at least one subsequent minor release, and
  only then removed in a major release.
- **Moved modules keep a re-export shim** at the old path for at least one minor release.
- **Breaking changes are documented under a `### Breaking` heading**, with migration steps.
- The package entry points (`main`, `module`, `types`, `exports`) are part of the contract.
  Changing them is a breaking change.

---

## [Unreleased]

---

## [0.3.0] - 2026-07-21

### Fixed

- **`uploadFile()` threw on Node 18.** `File` only became a global in Node 20, and the
  upload path did an unguarded `file instanceof File`, so on Node 18 every call failed with
  `ReferenceError: File is not defined` - including calls passing a plain `Blob`, which
  never needed the global at all. The package declares `engines.node >= 18`, so this broke
  file upload for supported runtimes. The check is now guarded before it touches the
  global, and a regression test runs the upload path with `File` removed.
- **`npm publish` would have failed.** `@10xscale/agentflow-client` is a scoped package,
  and scoped packages default to `restricted`. Without `publishConfig.access: "public"`
  the publish is rejected. Added, along with `provenance: true`.
- **The build was not cross-platform.** `npm run build` ended in `cp -r dist-types/* dist/`,
  which does not exist on Windows, so Windows contributors could not build the package at
  all. `tsc` now emits declarations straight into `dist/` via `tsconfig.build.json`, and
  the `cp` step is gone.
- **Shipped sourcemaps did not resolve.** The tarball contained 41 `.map` files but no
  sources, so every map pointed at files the consumer did not have. `src/` is now included
  in `files`.
- **`NodeJS.Timeout` leaked into the public types.** `forgetMemories` annotated its timer
  with the `NodeJS` namespace, which forced every consumer - including browser-only ones -
  to install `@types/node`. Now uses the portable `ReturnType<typeof setTimeout>`.
- `Error.captureStackTrace` is now accessed structurally, so the build no longer depends
  on ambient Node typings.

### Added

- `client.graphTools()` - lists the tools exposed by the graph's tool nodes, grouped by
  node, each tagged with its source (`local` / `mcp` / `remote`). Types are exported from
  `endpoints/graphTools.ts`.
- `client.observability(threadId, runId?)` - returns the reconstructed trace (spans,
  events, cost) for a thread, defaulting to the latest run. Types are exported from
  `endpoints/observability.ts`.
- ESLint 9 (flat config) and Prettier, with `lint`, `format`, `typecheck`, and an
  aggregate `check` script.
- `tsconfig.build.json` for declaration emit, separate from the type-check config.
- CI workflow: lint + Prettier + `tsc --noEmit`, tests on Node 18/20/22, and a `package`
  job that verifies every declared entry point exists inside the actual tarball and smoke
  tests both the CJS and ESM entry points from a clean install.
- Release workflow gated on CI, with a tag-vs-`package.json` version check.
- CodeQL scanning and Dependabot.
- `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `RELEASE_NOTES.md`, issue forms,
  and a pull request template.

### Changed

- **Upgraded vitest 1.x to 3.x and vite 5.x to 7.x**, clearing all 11 reported
  vulnerabilities (3 critical, 5 high). `npm audit` now reports zero.
- Coverage thresholds raised and pinned to the measured numbers as a ratchet
  (72% lines/statements, 82% branches, 76% functions). Note that vitest 3 remaps v8
  coverage more accurately than vitest 1 did, so these read lower than the previous
  config claimed without any real change in what the tests exercise.
- `tsconfig.json` now type-checks `tests/` as well as `src/`; it previously covered only
  `src/`, so six type errors in the test suite had gone unnoticed. All are fixed.
- Twelve `@ts-ignore` comments became `@ts-expect-error`, which revealed that every one of
  them was suppressing nothing. All removed.

### Removed

- `check.ts` - an unreferenced scratch script at the repo root that imported from a
  non-existent `./dist/index.d.js`.
- `.npmignore` - dead configuration. `files` in `package.json` takes precedence, so this
  file had no effect and only invited confusion.
- Dead code in `src`: `makeSingleStreamCall` (`endpoints/stream.ts`),
  `isRemoteToolCallChunk` and `REMOTE_TOOL_CALL_REASON` (`endpoints/wsStream.ts`). All were
  unexported and unreferenced. Three unused imports in `client.ts` were also dropped; the
  types remain publicly exported from their own modules, so this is not an API change.

---

## [0.2.0]

Initial entry in this changelog. Releases before `0.2.0` were not tracked here.

- a2a, a2ui, and the React surface were removed.
- Added the realtime audio client (`client.realtime(...)` returning `RealtimeSession`).
- Added dual ESM/CJS exports.

[Unreleased]: https://github.com/10xHub/agentflow/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/10xHub/agentflow/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/10xHub/agentflow/releases/tag/v0.2.0
