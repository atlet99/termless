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
