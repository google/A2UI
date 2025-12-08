.PHONY: help quickstart samples-list editor-serve env-debug env-verify docs-serve docs-build samples-verify

# --- Developer Commands ---

help: ## Show this help message
	@echo 'Usage: make [target]'
	@awk 'BEGIN {FS = ":.*##"; printf "\n\033[1mDeveloper Commands:\033[0m\n"} \
		/^# --- Maintainer Commands ---/ { printf "\n\033[1mMaintainer Commands:\033[0m\n" } \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' \
		$(MAKEFILE_LIST)

quickstart: ## Show quickstart guide
	@echo ''
	@echo 'Welcome to A2UI!'
	@echo '----------------'
	@echo '1. Verify your environment:'
	@echo '   make env-verify'
	@echo ''
	@echo '2. Explore samples:'
	@echo '   make samples-list'
	@echo ''
	@echo '3. Run the editor:'
	@echo '   make editor-serve'
	@echo ''

samples-list: ## List available samples
	@echo ''
	@echo 'Available Samples:'
	@echo '------------------'
	@echo 'Python Agents (a2a_agents/python/adk/samples):'
	@ls -1 a2a_agents/python/adk/samples | grep -v "__" | sed 's/^/  - /'
	@echo ''
	@echo 'Web Clients (samples/client):'
	@ls -1 samples/client | grep -v "__" | sed 's/^/  - /'
	@echo ''

editor-serve: ## Run the A2UI Editor
	@echo 'Starting A2UI Editor...'
	@cd editor && npm run serve

env-verify: ## Run environment verification
	python3 .scripts/devs/env_verify.py

env-debug: ## Run environment debug script
	python3 .scripts/admin/env_debug.py


# --- Maintainer Commands ---

docs-serve: ## Serve documentation locally
	mkdocs serve

docs-build: ## Build documentation
	mkdocs build

samples-verify: ## Run samples verification script
	python3 .scripts/admin/samples_verify.py
