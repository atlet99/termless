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

db-migrate:  ## Apply Prisma migrations
	$(call log_step, "Running database migrations")
	@pnpm exec prisma migrate deploy
	$(call log_ok, "Migrations applied")

db-migrate-dev:  ## Create a new migration (dev)
	$(call log_step, "Creating migration")
	@read -p "Migration name: " name && \
		pnpm exec prisma migrate dev --name "$$name"

db-generate:  ## Regenerate Prisma Client
	@pnpm exec prisma generate
	$(call log_ok, "Prisma client generated")

db-seed:  ## Seed the database with initial data
	$(call log_step, "Seeding database")
	@pnpm exec prisma db seed
	$(call log_ok, "Database seeded")

db-studio:  ## Open Prisma Studio
	@pnpm exec prisma studio

db-reset:  ## Reset the database (⚠ deletes all data)
	$(call log_warn, "This will DELETE all database data!")
	@read -p "Type 'yes' to confirm: " confirm && [ "$$confirm" = "yes" ]
	@pnpm exec prisma migrate reset --force
	$(call log_ok, "Database reset complete")

db-backup:  ## Create a database dump
	$(call log_step, "Creating database backup")
	@mkdir -p backups
	@docker compose exec postgres pg_dump -U termless termless \
		> backups/termless-$(shell date +%Y%m%d-%H%M%S).sql
	$(call log_ok, "Backup saved to backups/")

.PHONY: db-migrate db-migrate-dev db-generate db-seed db-studio db-reset db-backup
