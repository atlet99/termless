# Copyright 2026 Abdurakhman Rakhmankulov
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

##@ Lint

lint:  ## Run ESLint per-package + Biome — all errors together
	$(call log_step, "Running ESLint - all packages")
	@pnpm turbo run lint --continue
	$(call log_step, "Running Biome check")
	@pnpm exec biome check .
	$(call log_ok, "All checks passed")

lint-fix:  ## Auto-fix ESLint + Biome issues
	$(call log_step, "Fixing ESLint issues")
	@pnpm turbo run lint:fix --continue
	$(call log_step, "Fixing Biome issues")
	@pnpm exec biome check --write .
	$(call log_ok, "All fixes applied")

lint-root:  ## Run ESLint from root (single pass, may have React plugin issues)
	@pnpm exec eslint . --max-warnings=0

biome:  ## Run Biome check (lint + format)
	@pnpm exec biome check .

biome-fix:  ## Auto-fix Biome issues
	@pnpm exec biome check --write .

format-only:  ## Format code only (Biome formatter)
	@pnpm exec biome format --write .

format-check:  ## Check formatting without changes
	@pnpm exec biome format .

.PHONY: lint lint-fix lint-root biome biome-fix format-only format-check
