##@ Development

install:  ## Install dependencies (pnpm)
	$(call log_step, "Installing dependencies")
	@pnpm install --frozen-lockfile
	$(call log_ok, "Dependencies installed")

dev:  ## Start dev servers (API + Dashboard)
	$(call log_step, "Starting dev servers")
	@pnpm turbo run dev --filter=@termless/api --filter=@termless/dashboard

build-ts:  ## Build TypeScript for all packages
	$(call log_step, "Building TypeScript")
	@pnpm turbo run build
	$(call log_ok, "Build complete")

typecheck:  ## Check TypeScript types
	$(call log_step, "Type checking")
	@pnpm turbo run typecheck
	$(call log_ok, "Typecheck passed")

clean:  ## Remove build artifacts
	$(call log_step, "Cleaning build artifacts")
	@find . -name 'dist' -type d -not -path '*/node_modules/*' | xargs rm -rf
	@find . -name '.turbo' -type d | xargs rm -rf
	$(call log_ok, "Cleaned")

test:  ## Run unit tests
	$(call log_step, "Running tests")
	@pnpm turbo run test
	$(call log_ok, "Tests passed")

test-watch:  ## Run tests in watch mode
	@pnpm turbo run test -- --watch

test-e2e:  ## Run E2E tests (Playwright)
	$(call log_step, "Running E2E tests")
	@pnpm exec playwright test
	$(call log_ok, "E2E tests passed")

.PHONY: install dev build-ts typecheck clean test test-watch test-e2e
