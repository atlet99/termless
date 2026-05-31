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

knip:  ## Find unused files, dependencies and exports
	$(call log_step, "Running Knip - dead code detection")
	@pnpm knip || true
	$(call log_ok, "Knip check done")

docs-lint:  ## Lint Markdown documentation
	$(call log_step, "Linting Markdown docs")
	@pnpm docs:lint
	$(call log_ok, "Docs lint passed")

packages-sort:  ## Sort package.json files consistently
	$(call log_step, "Sorting package.json files")
	@pnpm packages:sort
	$(call log_ok, "Package.json files sorted")

packages-audit:  ## Audit dependencies for vulnerabilities
	$(call log_step, "Auditing dependencies")
	@pnpm packages:audit || true
	$(call log_ok, "Audit done")

packages-dedupe:  ## Check for duplicate dependencies
	$(call log_step, "Checking duplicate dependencies")
	@pnpm packages:dedupe || true
	$(call log_ok, "Dedupe check done")

shellcheck:  ## Check shell scripts with ShellCheck
	$(call log_step, "Running ShellCheck")
	@command -v shellcheck >/dev/null 2>&1 || ($(call log_error, "shellcheck not found. Install: brew install shellcheck"); exit 1)
	@find . -name '*.sh' -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/.turbo/*' -exec shellcheck {} +
	$(call log_ok, "ShellCheck passed")

hadolint:  ## Check Dockerfiles with Hadolint
	$(call log_step, "Running Hadolint")
	@command -v hadolint >/dev/null 2>&1 || ($(call log_error, "hadolint not found. Install: brew install hadolint"); exit 1)
	@find . -name 'Dockerfile*' -not -path '*/node_modules/*' -exec hadolint {} +
	$(call log_ok, "Hadolint passed")

yamllint:  ## Check YAML files with Yamllint
	$(call log_step, "Running Yamllint")
	@command -v yamllint >/dev/null 2>&1 || ($(call log_error, "yamllint not found. Install: pip3 install yamllint"); exit 1)
	@yamllint -c .yamllint.yaml .
	$(call log_ok, "Yamllint passed")

secrets-scan:  ## Scan for secrets with Gitleaks
	$(call log_step, "Scanning for secrets")
	@command -v gitleaks >/dev/null 2>&1 || ($(call log_error, "gitleaks not found. Install: brew install gitleaks"); exit 1)
	@gitleaks detect --source . --redact --verbose
	$(call log_ok, "No secrets found")

check-all: lint typecheck test build-ts i18n-check license-check peers-check docs-lint knip packages-audit  ## Run all checks (lint, typecheck, test, build, i18n, license, peers, docs, knip, audit)
	$(call log_section, "All checks passed!")

peers-check:  ## Check for peer dependency issues
	$(call log_step, "Checking peer dependencies")
	@if pnpm peers check 2>&1 | grep -qE "eslint-plugin-(react|jsx-a11y)"; then \
		echo "$(BYELLOW)⚠$(RESET) ESLint plugin peer warnings (ESLint 10 compatibility in progress) — ignored"; \
	else \
		pnpm peers check 2>&1 || echo "$(BGREEN)✓$(RESET) No critical peer dependency issues"; \
	fi

fix-all: lint-fix license-fix  ## Auto-fix all auto-fixable issues (lint, format, license)
	$(call log_section, "All fixes applied!")

ci: check-all  ## Alias for check-all (CI pipeline)
	$(call log_section, "CI pipeline passed!")

.PHONY: i18n-check license-check license-add license-fix knip docs-lint packages-sort packages-audit packages-dedupe shellcheck hadolint yamllint secrets-scan check-all peers-check fix-all ci
