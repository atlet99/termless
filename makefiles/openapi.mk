##@ OpenAPI

openapi-export:  ## Export OpenAPI spec to openapi.json
	$(call log_step, "Exporting OpenAPI spec")
	@node --import=tsx apps/api/src/scripts/export-spec.ts > openapi.json
	$(call log_ok, "Spec exported to openapi.json")

openapi-validate: openapi-export  ## Validate OpenAPI spec (Redocly)
	$(call log_step, "Validating OpenAPI spec")
	@npx @redocly/cli lint openapi.json
	$(call log_ok, "Spec is valid")

openapi-diff:  ## Show breaking changes vs previous version
	$(call log_step, "Comparing OpenAPI specs")
	@[ -f openapi.prev.json ] || ($(call log_warn, "No previous spec found"); exit 0)
	@npx openapi-diff openapi.prev.json openapi.json

openapi-preview:  ## Open Scalar UI preview locally
	$(call log_step, "Starting Scalar preview")
	@npx @scalar/api-reference openapi.json --port 8088
	@open http://localhost:8088 2>/dev/null || true

openapi-ci: openapi-validate  ## Full OpenAPI check for CI
	$(call log_ok, "OpenAPI CI checks passed")

.PHONY: openapi-export openapi-validate openapi-diff openapi-preview openapi-ci
