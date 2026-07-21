# What and why

<!-- What does this change, and what problem does it solve? Link the issue: Fixes #123 -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change to the public API or package entry points
- [ ] Refactor with no behaviour change
- [ ] Documentation
- [ ] Build, CI, or packaging

## Checks

- [ ] `npm run check` passes (lint + typecheck + tests)
- [ ] `npm run format:check` is clean
- [ ] `npm run test:coverage` passes the coverage ratchet
- [ ] `npm run build` succeeds
- [ ] New behaviour has a test; a bug fix has a test that fails without the fix

## Documentation

- [ ] `CHANGELOG.md` updated under `[Unreleased]`
- [ ] `README.md` updated if a public method signature changed or an endpoint was added
- [ ] Breaking changes are under a `### Breaking` heading with migration steps

## If you touched packaging, entry points, or the build

- [ ] I ran `npm run build && npm pack --dry-run` and confirmed what actually ships

<!--
  Two traps this package has hit before:
    - scoped packages need publishConfig.access=public or publish is rejected
    - build scripts must be cross-platform; `cp -r` breaks Windows contributors
-->

## If you added a public export

- [ ] I intend to support it long-term (`index.ts` uses `export *`, so every exported
      symbol in a re-exported module is public API)

## If you touched `src/` types

- [ ] No reference to the `NodeJS` namespace or other ambient Node typings (this package
      targets browsers too, and that would force consumers to install `@types/node`)

---

<!-- Security vulnerabilities do not belong in a PR or issue. See SECURITY.md. -->
