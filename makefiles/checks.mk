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

##@ Checks

i18n-check:  ## Check i18n locale key integrity
	$(call log_step, "Checking i18n locale keys")
	@node --import=tsx hack/i18n-integrity.ts
	$(call log_ok, "i18n keys OK")

license-check:  ## Check license headers in all source files
	$(call log_step, "Checking license headers")
	@node --import=tsx hack/license-header.ts check

license-add:  ## Add license headers to source files missing them (won't touch existing wrong ones)
	$(call log_step, "Adding license headers")
	@node --import=tsx hack/license-header.ts add
	$(call log_ok, "License headers processed")

license-fix:  ## Insert or replace license headers to match canonical form
	$(call log_step, "Fixing license headers")
	@node --import=tsx hack/license-header.ts fix
	$(call log_ok, "License headers fixed")

check-all: lint typecheck i18n-check license-check peers-check  ## Run all checks (lint, typecheck, i18n, license, peers)
	$(call log_section, "All checks passed!")

peers-check:  ## Check for peer dependency issues
	$(call log_step, "Checking peer dependencies")
	@pnpm peers check

fix-all: lint-fix license-fix  ## Auto-fix all auto-fixable issues (lint, format, license)
	$(call log_section, "All fixes applied!")

.PHONY: i18n-check license-check license-add license-fix check-all fix-all
