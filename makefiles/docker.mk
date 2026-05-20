COMPOSE         := docker compose
COMPOSE_DEV     := docker compose -f docker-compose.yml -f docker-compose.dev.yml
PROJECT_NAME    := termless
DOCKER_REGISTRY ?= ghcr.io/atlet99/termless

##@ Docker

up:  ## Start all services (production mode)
	$(call log_step, "Starting Termless services")
	@$(COMPOSE) up -d
	$(call log_ok, "Services started. Run 'make logs' to follow output")

up-dev:  ## Start in dev mode (with hot reload)
	$(call log_step, "Starting Termless in dev mode")
	@$(COMPOSE_DEV) up -d
	$(call log_ok, "Dev services started")

down:  ## Stop all services
	$(call log_step, "Stopping services")
	@$(COMPOSE) down
	$(call log_ok, "Services stopped")

down-volumes:  ## Stop and remove volumes (⚠ deletes data)
	$(call log_warn, "Removing ALL volumes including database data!")
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	@$(COMPOSE) down -v
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

.PHONY: up up-dev down down-volumes restart restart-api build build-push logs logs-api logs-db ps pull
