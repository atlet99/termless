##@ Database

db-migrate:  ## Применить миграции Prisma
	$(call log_step, "Running database migrations")
	@pnpm exec prisma migrate deploy
	$(call log_ok, "Migrations applied")

db-migrate-dev:  ## Создать новую миграцию (dev)
	$(call log_step, "Creating migration")
	@read -p "Migration name: " name && \
		pnpm exec prisma migrate dev --name "$$name"

db-generate:  ## Регенерировать Prisma Client
	@pnpm exec prisma generate
	$(call log_ok, "Prisma client generated")

db-seed:  ## Засеять БД начальными данными
	$(call log_step, "Seeding database")
	@pnpm exec prisma db seed
	$(call log_ok, "Database seeded")

db-studio:  ## Открыть Prisma Studio
	@pnpm exec prisma studio

db-reset:  ## Сбросить БД (⚠ удаляет все данные)
	$(call log_warn, "This will DELETE all database data!")
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	@pnpm exec prisma migrate reset --force
	$(call log_ok, "Database reset complete")

db-backup:  ## Создать дамп БД
	$(call log_step, "Creating database backup")
	@mkdir -p backups
	@docker compose exec postgres pg_dump -U termless termless \
		> backups/termless-$(shell date +%Y%m%d-%H%M%S).sql
	$(call log_ok, "Backup saved to backups/")

.PHONY: db-migrate db-migrate-dev db-generate db-seed db-studio db-reset db-backup
