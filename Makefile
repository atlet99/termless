SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c

MAKEFLAGS += --no-print-directory

# ── Auto-activate nvm from .nvmrc ───────────────────────────────────────────
NVM_DIR ?= $(HOME)/.nvm
NVMRC   := $(shell cat .nvmrc 2>/dev/null)

ifeq ($(NVMRC),)
  $(error .nvmrc not found or empty)
endif

# Source nvm if available, then use the version from .nvmrc
define NVM_USE
[ -s "$(NVM_DIR)/nvm.sh" ] && . "$(NVM_DIR)/nvm.sh"; nvm use --silent 2>/dev/null || nvm install --lts 2>/dev/null
endef

# Export so all recipe lines inherit the correct node
export PATH := $(shell bash -c '[ -s "$(NVM_DIR)/nvm.sh" ] && . "$(NVM_DIR)/nvm.sh" && nvm use --silent >/dev/null 2>&1 && echo $$PATH')

include makefiles/colors.mk
include makefiles/help.mk
include makefiles/docker.mk
include makefiles/dev.mk
include makefiles/lint.mk
include makefiles/db.mk
include makefiles/openapi.mk

##@ Compound

setup: install db-generate db-migrate db-seed  ## Полная начальная настройка проекта
	$(call log_section, "Termless setup complete!")
	$(call log_info, "Run 'make up-dev' to start in dev mode")
	$(call log_info, "Run 'make up' to start in production mode")

ci: lint typecheck test openapi-ci  ## Полная проверка для CI pipeline
	$(call log_section, "CI checks passed!")

check-env:  ## Проверить наличие обязательных переменных окружения
	$(call log_step, "Checking environment")
	@[ -f .env ] || ($(call log_error, ".env file not found. Copy from .env.example"); exit 1)
	@for var in AUTH_MODE DATABASE_URL REDIS_URL ANTHROPIC_API_KEY; do \
		grep -q "^$$var=" .env || (printf "$(BRED)✗$(RESET) Missing: $$var\n"; exit 1); \
		printf "$(BGREEN)✓$(RESET) $$var\n"; \
	done
	$(call log_ok, "Environment OK")

version:  ## Показать версии инструментов
	@printf "$(BWHITE)Tool versions:$(RESET)\n"
	@printf "  Node.js : $(CYAN)%s$(RESET)\n" "$$(node --version)"
	@printf "  pnpm    : $(CYAN)%s$(RESET)\n" "$$(pnpm --version)"
	@printf "  Docker  : $(CYAN)%s$(RESET)\n" "$$(docker --version | cut -d' ' -f3 | tr -d ',')"
	@printf "  Git     : $(CYAN)%s$(RESET)\n" "$$(git --version | cut -d' ' -f3)"

token:  ## Сгенерировать безопасный случайный токен (32 байта)
	@printf "$(BGREEN)%s$(RESET)\n" "$$(openssl rand -hex 32)"

.PHONY: setup ci check-env version token
