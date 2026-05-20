COMPOSE         := docker compose
COMPOSE_DEV     := docker compose -f docker-compose.yml -f docker-compose.dev.yml
PROJECT_NAME    := termless
DOCKER_REGISTRY ?= ghcr.io/your-org/termless

##@ Docker

up:  ## Запустить все сервисы (production mode)
	$(call log_step, "Starting Termless services")
	@$(COMPOSE) up -d
	$(call log_ok, "Services started. Run 'make logs' to follow output")

up-dev:  ## Запустить в dev режиме (с hot reload)
	$(call log_step, "Starting Termless in dev mode")
	@$(COMPOSE_DEV) up -d
	$(call log_ok, "Dev services started")

down:  ## Остановить все сервисы
	$(call log_step, "Stopping services")
	@$(COMPOSE) down
	$(call log_ok, "Services stopped")

down-volumes:  ## Остановить и удалить volumes (⚠ удаляет данные)
	$(call log_warn, "Removing ALL volumes including database data!")
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	@$(COMPOSE) down -v
	$(call log_ok, "Services and volumes removed")

restart:  ## Перезапустить все сервисы
	@$(MAKE) down up

restart-api:  ## Перезапустить только API
	$(call log_step, "Restarting API")
	@$(COMPOSE) restart api
	$(call log_ok, "API restarted")

build:  ## Собрать все Docker образы
	$(call log_step, "Building images")
	@$(COMPOSE) build --no-cache
	$(call log_ok, "Build complete")

build-push:  ## Собрать и запушить образы в registry
	$(call log_step, "Building and pushing images")
	@$(COMPOSE) build
	@docker push $(DOCKER_REGISTRY)/api:latest
	@docker push $(DOCKER_REGISTRY)/dashboard:latest
	$(call log_ok, "Images pushed to $(DOCKER_REGISTRY)")

logs:  ## Следить за логами всех сервисов
	@$(COMPOSE) logs -f

logs-api:  ## Логи только API
	@$(COMPOSE) logs -f api

logs-db:  ## Логи PostgreSQL
	@$(COMPOSE) logs -f postgres

ps:  ## Статус контейнеров
	@$(COMPOSE) ps

pull:  ## Обновить base образы
	@$(COMPOSE) pull

.PHONY: up up-dev down down-volumes restart restart-api build build-push logs logs-api logs-db ps pull
