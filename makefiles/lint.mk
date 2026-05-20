##@ Code Quality

lint:  ## Запустить Biome (lint + format check)
	$(call log_step, "Running Biome linter")
	@pnpm biome check .
	$(call log_ok, "Lint passed")

lint-fix:  ## Автоисправление через Biome
	$(call log_step, "Fixing lint issues")
	@pnpm biome check --write .
	$(call log_ok, "Lint fixed")

format:  ## Форматировать код
	@pnpm biome format --write .

.PHONY: lint lint-fix format
