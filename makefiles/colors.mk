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

RESET   := \033[0m
BOLD    := \033[1m
DIM     := \033[2m

BLACK   := \033[0;30m
RED     := \033[0;31m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
BLUE    := \033[0;34m
MAGENTA := \033[0;35m
CYAN    := \033[0;36m
WHITE   := \033[0;37m

BRED    := \033[1;31m
BGREEN  := \033[1;32m
BYELLOW := \033[1;33m
BBLUE   := \033[1;34m
BCYAN   := \033[1;36m
BWHITE  := \033[1;37m

define log_info
	@printf "$(CYAN)ℹ $(RESET)$(1)\n"
endef

define log_ok
	@printf "$(BGREEN)✓ $(RESET)$(1)\n"
endef

define log_warn
	@printf "$(BYELLOW)⚠ $(RESET)$(1)\n"
endef

define log_error
	@printf "$(BRED)✗ $(RESET)$(1)\n"
endef

define log_step
	@printf "\n$(BBLUE)▶ $(BOLD)$(1)$(RESET)\n"
endef

define log_section
	@printf "\n$(BWHITE)═══════════════════════════════════════$(RESET)\n"
	@printf "$(BWHITE)  $(1)$(RESET)\n"
	@printf "$(BWHITE)═══════════════════════════════════════$(RESET)\n\n"
endef
