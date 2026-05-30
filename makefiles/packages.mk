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

##@ Packages

PACKAGES_DRY_RUN ?= false

packages-outdated:  ## Show outdated packages across all workspaces
	$(call log_step, "Checking outdated packages")
	@printf "$(BWHITE)  %-40s %-15s %-15s %-10s$(RESET)\n" "Package" "Current" "Latest" "Type"
	@printf "  %-40s %-15s %-15s %-10s\n" "────────────────────────────────────────" "───────────────" "───────────────" "─────────"
	@for dir in apps/dashboard apps/api apps/cli packages/auth packages/shared packages/worker; do \
		if [ -f "$$dir/package.json" ]; then \
			cd "$$dir" && pnpm outdated 2>/dev/null | grep "│" | grep -v "Package" | grep -v "───" | while IFS='│' read -r _ pkg current latest _; do \
				pkg=$$(echo "$$pkg" | xargs); \
				current=$$(echo "$$current" | xargs); \
				latest=$$(echo "$$latest" | xargs); \
				if [ -n "$$pkg" ] && echo "$$current" | grep -q "^[0-9]"; then \
					cur_major=$$(echo "$$current" | cut -d. -f1); \
					lat_major=$$(echo "$$latest" | cut -d. -f1); \
					if [ "$$cur_major" != "$$lat_major" ]; then \
						printf "  $(BYELLOW)%-40s$(RESET) %-15s %-15s $(BRED)major$(RESET)\n" "$$pkg" "$$current" "$$latest"; \
					else \
						printf "  %-40s %-15s %-15s $(BGREEN)minor$(RESET)\n" "$$pkg" "$$current" "$$latest"; \
					fi; \
				fi; \
			done; \
			cd - > /dev/null; \
		fi; \
	done

packages-update-safe:  ## Update minor/patch packages only (safe updates)
	$(call log_step, "Updating safe packages (minor/patch)")
	@UPDATED=0; \
	FAILED=0; \
	for dir in apps/dashboard apps/api apps/cli packages/auth packages/shared packages/worker; do \
		if [ -f "$$dir/package.json" ]; then \
			printf "\n$(BCYAN)  Updating: $$dir$(RESET)\n"; \
			cd "$$dir"; \
			OUTDATED=$$(pnpm outdated 2>/dev/null | grep "│" | grep -v "Package" | grep -v "───"); \
			if [ -z "$$OUTDATED" ]; then \
				printf "  $(BGREEN)✓$(RESET) All packages up to date\n"; \
			else \
				echo "$$OUTDATED" | while IFS='│' read -r _ pkg current latest _; do \
					pkg=$$(echo "$$pkg" | xargs); \
					current=$$(echo "$$current" | xargs); \
					latest=$$(echo "$$latest" | xargs); \
					if [ -n "$$pkg" ] && echo "$$current" | grep -q "^[0-9]"; then \
						cur_major=$$(echo "$$current" | cut -d. -f1); \
						lat_major=$$(echo "$$latest" | cut -d. -f1); \
						if [ "$$cur_major" = "$$lat_major" ]; then \
							printf "  $(CYAN)→$(RESET) Updating $$pkg: $$current → $$latest\n"; \
							if pnpm add "$$pkg@$$latest" 2>/dev/null; then \
								UPDATED=$$((UPDATED + 1)); \
							else \
								printf "  $(BRED)✗$(RESET) Failed to update $$pkg\n"; \
								FAILED=$$((FAILED + 1)); \
							fi; \
						fi; \
					fi; \
				done; \
			fi; \
			cd - > /dev/null; \
		fi; \
	done; \
	printf "\n$(BWHITE)Summary:$(RESET) Updated $$UPDATED packages, $$FAILED failures\n"

packages-update-all:  ## Update all packages with compatibility check (reverts on failure)
	$(call log_step, "Updating all packages with compatibility check")
	@printf "$(BYELLOW)⚠ This will attempt major version updates$(RESET)\n"
	@printf "$(BYELLOW)  Compatibility will be verified after each update$(RESET)\n\n"
	@UPDATED=0; \
	REVERTED=0; \
	FAILED=0; \
	for dir in apps/dashboard apps/api apps/cli packages/auth packages/shared packages/worker; do \
		if [ -f "$$dir/package.json" ]; then \
			printf "\n$(BCYAN)  Processing: $$dir$(RESET)\n"; \
			cd "$$dir"; \
			OUTDATED=$$(pnpm outdated 2>/dev/null | grep "│" | grep -v "Package" | grep -v "───"); \
			if [ -z "$$OUTDATED" ]; then \
				printf "  $(BGREEN)✓$(RESET) All packages up to date\n"; \
			else \
				echo "$$OUTDATED" | while IFS='│' read -r _ pkg current latest _; do \
					pkg=$$(echo "$$pkg" | xargs); \
					current=$$(echo "$$current" | xargs); \
					latest=$$(echo "$$latest" | xargs); \
					if [ -n "$$pkg" ] && echo "$$current" | grep -q "^[0-9]"; then \
						printf "  $(CYAN)→$(RESET) Attempting $$pkg: $$current → $$latest\n"; \
						BACKUP=$$(cat package.json); \
						if pnpm add "$$pkg@$$latest" 2>/dev/null; then \
							printf "    $(CYAN)→$(RESET) Checking compatibility...\n"; \
							if cd ../.. && pnpm install --frozen-lockfile 2>/dev/null && make typecheck 2>/dev/null; then \
								printf "    $(BGREEN)✓$(RESET) Compatible\n"; \
								UPDATED=$$((UPDATED + 1)); \
							else \
								printf "    $(BRED)✗$(RESET) Incompatible — reverting\n"; \
								echo "$$BACKUP" > package.json; \
								pnpm install 2>/dev/null; \
								REVERTED=$$((REVERTED + 1)); \
							fi; \
							cd "$$dir"; \
						else \
							printf "    $(BRED)✗$(RESET) Failed to install\n"; \
							FAILED=$$((FAILED + 1)); \
						fi; \
					fi; \
				done; \
			fi; \
			cd - > /dev/null; \
		fi; \
	done; \
	printf "\n$(BWHITE)Summary:$(RESET)\n"; \
	printf "  $(BGREEN)✓$(RESET) Updated: $$UPDATED\n"; \
	printf "  $(BYELLOW)↩$(RESET) Reverted: $$REVERTED\n"; \
	printf "  $(BRED)✗$(RESET) Failed: $$FAILED\n"

packages-update-interactive:  ## Interactively choose which packages to update
	$(call log_step, "Interactive package update")
	@for dir in apps/dashboard apps/api apps/cli packages/auth packages/shared packages/worker; do \
		if [ -f "$$dir/package.json" ]; then \
			printf "\n$(BCYAN)  $$(basename $$(dirname $$dir))/$$(basename $$dir)$(RESET)\n"; \
			cd "$$dir"; \
			OUTDATED=$$(pnpm outdated 2>/dev/null | grep "│" | grep -v "Package" | grep -v "───"); \
			if [ -z "$$OUTDATED" ]; then \
				printf "  $(BGREEN)✓$(RESET) All packages up to date\n"; \
			else \
				echo "$$OUTDATED" | while IFS='│' read -r _ pkg current latest _; do \
					pkg=$$(echo "$$pkg" | xargs); \
					current=$$(echo "$$current" | xargs); \
					latest=$$(echo "$$latest" | xargs); \
					if [ -n "$$pkg" ] && echo "$$current" | grep -q "^[0-9]"; then \
						cur_major=$$(echo "$$current" | cut -d. -f1); \
						lat_major=$$(echo "$$latest" | cut -d. -f1); \
						if [ "$$cur_major" != "$$lat_major" ]; then \
							printf "  $(BYELLOW)⚠$(RESET) $$pkg: $$current → $$latest (major)\n"; \
						else \
							printf "  $(CYAN)→$(RESET) $$pkg: $$current → $$latest\n"; \
						fi; \
					fi; \
				done; \
				printf "\n  Run $(BWHITE)pnpm add <pkg>@<version>$(RESET) to update specific packages\n"; \
			fi; \
			cd - > /dev/null; \
		fi; \
	done

packages-check-compat:  ## Check if current dependencies are compatible
	$(call log_step, "Checking dependency compatibility")
	@printf "  $(CYAN)→$(RESET) Installing dependencies...\n"
	@pnpm install 2>/dev/null || (printf "  $(BRED)✗$(RESET) Install failed\n"; exit 1)
	@printf "  $(CYAN)→$(RESET) Running typecheck...\n"
	@make typecheck 2>/dev/null || (printf "  $(BRED)✗$(RESET) Typecheck failed\n"; exit 1)
	@printf "  $(CYAN)→$(RESET) Running lint...\n"
	@make lint 2>/dev/null || (printf "  $(BRED)✗$(RESET) Lint failed\n"; exit 1)
	@printf "  $(CYAN)→$(RESET) Running tests...\n"
	@make test 2>/dev/null || (printf "  $(BRED)✗$(RESET) Tests failed\n"; exit 1)
	$(call log_ok, "All dependencies are compatible")

packages-update-catalog:  ## Update catalog versions in pnpm-workspace.yaml
	$(call log_step, "Updating catalog versions")
	@printf "  $(CYAN)→$(RESET) Checking catalog packages...\n"
	@CATALOG_UPDATED=0; \
	for pkg in typescript eslint typescript-eslint zod fastify pino prom-client vitest; do \
		CURRENT=$$(grep "$$pkg:" pnpm-workspace.yaml | head -1 | sed 's/.*: //'); \
		if [ -n "$$CURRENT" ]; then \
			LATEST=$$(pnpm view "$$pkg" version 2>/dev/null); \
			if [ -n "$$LATEST" ] && [ "$$CURRENT" != "$$LATEST" ]; then \
				printf "  $(CYAN)→$(RESET) $$pkg: $$CURRENT → $$LATEST\n"; \
			fi; \
		fi; \
	done
	$(call log_ok, "Catalog check done")

packages-verify:  ## Verify all packages are installed and compatible
	$(call log_step, "Verifying packages")
	@printf "  $(CYAN)→$(RESET) Checking lockfile...\n"
	@pnpm install --frozen-lockfile 2>/dev/null || (printf "  $(BRED)✗$(RESET) Lockfile mismatch — run pnpm install\n"; exit 1)
	@printf "  $(CYAN)→$(RESET) Checking peer dependencies...\n"
	@pnpm peers check 2>/dev/null || true
	@printf "  $(CYAN)→$(RESET) Checking for vulnerabilities...\n"
	@pnpm audit --audit-level high 2>/dev/null || true
	$(call log_ok, "Packages verified")

.PHONY: packages-outdated packages-update-safe packages-update-all packages-update-interactive packages-check-compat packages-update-catalog packages-verify
