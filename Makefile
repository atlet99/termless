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

SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c

MAKEFLAGS += --no-print-directory

# ── Auto-activate nvm from .nvmrc ───────────────────────────────────────────
NVM_DIR ?= $(HOME)/.nvm
NVMRC   := $(shell cat .nvmrc 2>/dev/null)

ifeq ($(NVMRC),)
  $(error .nvmrc not found or empty)
endif

# Ensure node from nvm is used - executed at Makefile parse time
$(shell [ -s "$(NVM_DIR)/nvm.sh" ] && . "$(NVM_DIR)/nvm.sh" && nvm use --silent 2>/dev/null || nvm install --lts 2>/dev/null)

# Export PATH with nvm node for all recipe lines
export PATH := $(shell bash -lc '[ -s "$(NVM_DIR)/nvm.sh" ] && . "$(NVM_DIR)/nvm.sh" && nvm use --silent >/dev/null 2>&1 && echo $$PATH')
export NVM_DIR

include makefiles/colors.mk
include makefiles/help.mk
include makefiles/docker.mk
include makefiles/dev.mk
include makefiles/lint.mk
include makefiles/db.mk
include makefiles/openapi.mk
include makefiles/checks.mk
include makefiles/packages.mk

##@ Compound

setup: install db-generate db-migrate db-seed license-add  ## Full initial project setup
	$(call log_section, "Termless setup complete!")
	$(call log_info, "Run 'make up-dev' to start in dev mode")
	$(call log_info, "Run 'make up' to start in production mode")

ci: lint typecheck test openapi-ci docs-lint knip  ## Full CI pipeline check
	$(call log_section, "CI checks passed!")

ci-security: packages-audit  ## Security-focused CI checks
	$(call log_section, "Security checks passed!")

sdk-ci: sdk-gen lint  ## SDK generation and lint check
	$(call log_section, "SDK CI passed!")

check-env:  ## Check required environment variables
	$(call log_step, "Checking environment")
	@[ -f .env ] || ($(call log_error, ".env file not found. Copy from .env.example"); exit 1)
	@for var in AUTH_MODE DATABASE_URL REDIS_URL ANTHROPIC_API_KEY; do \
		grep -q "^$$var=" .env || (printf "$(BRED)✗$(RESET) Missing: $$var\n"; exit 1); \
		printf "$(BGREEN)✓$(RESET) $$var\n"; \
	done
	$(call log_ok, "Environment OK")

version:  ## Show tool versions
	@printf "$(BWHITE)Tool versions:$(RESET)\n"
	@printf "  Node.js : $(CYAN)%s$(RESET)\n" "$$(node --version)"
	@printf "  pnpm    : $(CYAN)%s$(RESET)\n" "$$(pnpm --version)"
	@printf "  Docker  : $(CYAN)%s$(RESET)\n" "$$(docker --version | cut -d' ' -f3 | tr -d ',')"
	@printf "  Git     : $(CYAN)%s$(RESET)\n" "$$(git --version | cut -d' ' -f3)"

token:  ## Generate a secure random token (32 bytes)
	@printf "$(BGREEN)%s$(RESET)\n" "$$(openssl rand -hex 32)"

.PHONY: setup ci ci-security check-env version token
