##@ Code Quality

lint:  ## Run ESLint (type-aware) + Biome (format)
	$(call log_step, "Running ESLint")
	@pnpm turbo run lint
	$(call log_step, "Running Biome format check")
	@pnpm biome check .
	$(call log_ok, "All checks passed")

lint-fix:  ## Auto-fix ESLint + Biome issues
	$(call log_step, "Fixing ESLint issues")
	@pnpm turbo run lint:fix
	$(call log_step, "Fixing Biome issues")
	@pnpm biome check --write .
	$(call log_ok, "All fixes applied")

biome:  ## Run Biome only (lint + format check)
	@pnpm biome check .

biome-fix:  ## Run Biome auto-fix only
	@pnpm biome check --write .

format:  ## Format code (Biome)
	@pnpm biome format --write .

.PHONY: lint lint-fix biome biome-fix format
