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

COMPOSE         := docker compose
COMPOSE_DEV     := docker compose -f docker-compose.yml -f docker-compose.dev.yml
PROJECT_NAME    := termless
DOCKER_REGISTRY ?= ghcr.io/atlet99/termless
VOLUMES_DIR     := test_results/volumes

define generate_env
@if [ ! -f .env ]; then \
	echo "  Generating .env from .env.example with random secrets..."; \
	_pg_pass=$$(openssl rand -hex 32) && \
	_redis_pass=$$(openssl rand -hex 32) && \
	cp .env.example .env && \
	sed -i '' \
		-e "s/^SESSION_SECRET=.*/SESSION_SECRET=$$(openssl rand -hex 32)/" \
		-e "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$$_pg_pass/" \
		-e "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$$_redis_pass/" \
		-e "s|^DATABASE_URL=.*|DATABASE_URL=postgresql://termless:$$_pg_pass@postgres:5432/termless|" \
		-e "s|^REDIS_URL=.*|REDIS_URL=redis://:$$_redis_pass@redis:6379|" \
		-e "s|^WORKSPACE_ROOT=.*|WORKSPACE_ROOT=/workspace|" \
		.env; \
	echo "  .env created. Edit it to set ANTHROPIC_API_KEY etc."; \
fi
endef

##@ Docker

up:  ## Start all services (production mode)
	$(call log_step, "Starting Termless services")
	$(generate_env)
	@mkdir -p $(VOLUMES_DIR)/{workspace,postgres,redis}
	@$(COMPOSE) up -d
	$(call log_ok, "Services started. Run 'make logs' to follow output")

up-dev:  ## Start in dev mode (with hot reload)
	$(call log_step, "Starting Termless in dev mode")
	$(generate_env)
	@mkdir -p $(VOLUMES_DIR)/{workspace,postgres,redis}
	@$(COMPOSE_DEV) up -d
	$(call log_ok, "Dev services started — http://localhost:80")

quickstart: build up-dev  ## Build images and start dev environment in one go
	$(call log_section, "Quickstart ready!")
	$(call log_info, "Dashboard : http://localhost:80")
	$(call log_info, "API       : http://localhost:80/api")
	$(call log_info, "Logs      : make logs")

down:  ## Stop all services
	$(call log_step, "Stopping services")
	@$(COMPOSE) down
	$(call log_ok, "Services stopped")

down-volumes:  ## Stop and remove volumes (⚠ deletes data)
	$(call log_warn, "Removing ALL volumes including database data!")
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	@$(COMPOSE) down -v
	@rm -rf $(VOLUMES_DIR)
	$(call log_ok, "Services and volumes removed")

restart:  ## Restart all services
	@$(MAKE) down up

restart-api:  ## Restart API only
	$(call log_step, "Restarting API")
	@$(COMPOSE) restart api
	$(call log_ok, "API restarted")

build:  ## Build all Docker images
	$(call log_step, "Building images")
	@$(COMPOSE) build --no-cache
	$(call log_ok, "Build complete")

build-push:  ## Build and push images to registry
	$(call log_step, "Building and pushing images")
	@$(COMPOSE) build
	@docker push $(DOCKER_REGISTRY)/api:latest
	@docker push $(DOCKER_REGISTRY)/dashboard:latest
	$(call log_ok, "Images pushed to $(DOCKER_REGISTRY)")

logs:  ## Follow logs of all services
	@$(COMPOSE) logs -f

logs-api:  ## API logs only
	@$(COMPOSE) logs -f api

logs-db:  ## PostgreSQL logs
	@$(COMPOSE) logs -f postgres

ps:  ## Show container status
	@$(COMPOSE) ps

pull:  ## Update base images
	@$(COMPOSE) pull

.PHONY: up up-dev quickstart down down-volumes restart restart-api build build-push logs logs-api logs-db ps pull
