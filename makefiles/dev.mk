##@ Development

install:  ## Установить зависимости (pnpm)
	$(call log_step, "Installing dependencies")
	@pnpm install --frozen-lockfile
	$(call log_ok, "Dependencies installed")

dev:  ## Запустить dev серверы (API + Dashboard)
	$(call log_step, "Starting dev servers")
	@pnpm turbo run dev --filter=@termless/api --filter=@termless/dashboard

build-ts:  ## Собрать TypeScript для всех пакетов
	$(call log_step, "Building TypeScript")
	@pnpm turbo run build
	$(call log_ok, "Build complete")

typecheck:  ## Проверить типы TypeScript
	$(call log_step, "Type checking")
	@pnpm turbo run typecheck
	$(call log_ok, "Typecheck passed")

clean:  ## Удалить артефакты сборки
	$(call log_step, "Cleaning build artifacts")
	@find . -name 'dist' -type d -not -path '*/node_modules/*' | xargs rm -rf
	@find . -name '.turbo' -type d | xargs rm -rf
	$(call log_ok, "Cleaned")

test:  ## Запустить unit тесты
	$(call log_step, "Running tests")
	@pnpm turbo run test
	$(call log_ok, "Tests passed")

test-watch:  ## Запустить тесты в watch режиме
	@pnpm turbo run test -- --watch

test-e2e:  ## Запустить E2E тесты (Playwright)
	$(call log_step, "Running E2E tests")
	@pnpm exec playwright test
	$(call log_ok, "E2E tests passed")

.PHONY: install dev build-ts typecheck clean test test-watch test-e2e
