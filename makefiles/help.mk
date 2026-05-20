.DEFAULT_GOAL := help

help:  ## Show this help
	@printf "\n$(BWHITE)Termless$(RESET) — dev toolkit\n\n"
	@grep -E '^[a-zA-Z_0-9-]+:.*?## .*$$|^##@' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; \
			/^##@/ { \
				gsub(/^##@ /, "", $$0); \
				printf "\n$(BBLUE)%s$(RESET)\n", $$0; \
				next \
			} \
			{ \
				printf "  $(CYAN)%-26s$(RESET) %s\n", $$1, $$2 \
			}'
	@printf "\n"

.PHONY: help
