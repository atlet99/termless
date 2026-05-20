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
