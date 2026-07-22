Expected head: 40fe79035828a870a720d3ca858d8fd1bb9cc2ed
Node: v22.16.0
npm: 10.9.2
Lockfile version: 3
Lockfile package entries: 534

lockfile_regeneration: PASS (0) — npm install --package-lock-only --ignore-scripts --no-audit --no-fund
npm_ci: PASS (0) — npm ci
dependency_tree: PASS (0) — test -x node_modules/.bin/vite && test -x node_modules/.bin/tsc && test -x node_modules/.bin/playwright && node -e "console.log(require.resolve('rollup/package.json'))"
lint: PASS (0) — npm run lint
typecheck: PASS (0) — npm run typecheck
unit: PASS (0) — npm test
build: PASS (0) — npm run build
playwright_install: PASS (0) — npx playwright install --with-deps chromium
smoke: PASS (0) — npx playwright test tests/e2e/all-pages.smoke.spec.ts --workers=1
routes: FAIL (1) — npm run e2e:routes
