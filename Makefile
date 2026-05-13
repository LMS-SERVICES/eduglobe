# EduGlobe — Docker workflow (aligned with LMS-USER-PORTAL)
# Usage: make help

SHELL := /bin/bash
.DEFAULT_GOAL := help

# --- configurable ---
IMAGE_NAME     ?= eduglobe-academy
CONTAINER_NAME ?= eduglobe-app
PORT           ?= 3001
COMPOSE        ?= docker compose
COMPOSE_FILE   ?= docker-compose.yml

.PHONY: help build run stop restart logs shell clean \
        compose-build compose-up compose-down compose-logs compose-ps compose-restart \
        prod-up prod-down prod-logs

##@ General

help: ## Show available targets
	@echo ""
	@echo "  EduGlobe — Docker"
	@echo "  ─────────────────────────────────────────"
	@echo ""
	@echo "  Image:     $(IMAGE_NAME)"
	@echo "  Container: $(CONTAINER_NAME)"
	@echo "  Port:      $(PORT)"
	@echo ""
	@echo "  Docker (plain image)"
	@echo "    make build          Build production image"
	@echo "    make run            Run container (stops/removes existing name)"
	@echo "    make stop           Stop and remove container"
	@echo "    make restart        stop + run"
	@echo "    make logs           Follow container logs"
	@echo "    make shell          Shell as root (debug)"
	@echo "    make clean          Remove local image $(IMAGE_NAME)"
	@echo ""
	@echo "  Docker Compose (recommended)"
	@echo "    make compose-build  docker compose build"
	@echo "    make compose-up     Build + start detached"
	@echo "    make compose-down   Stop and remove stack"
	@echo "    make compose-logs   Follow compose logs"
	@echo "    make compose-ps     List services"
	@echo "    make compose-restart compose-down + compose-up"
	@echo ""
	@echo "  Aliases (same as LMS-USER-PORTAL Makefile)"
	@echo "    make prod-up | prod-down | prod-logs"
	@echo ""
	@echo "  Prereqs: .env in project root (DATABASE_URL, NEXTAUTH_*, etc.)"
	@echo ""

##@ Docker (docker run)

build: ## Build the production image
	docker build -t $(IMAGE_NAME) .

run: ## Run container with .env (replaces existing $(CONTAINER_NAME))
	@if [[ ! -f .env ]]; then echo "Missing .env — copy from .env.example or create one."; exit 1; fi
	@if [ "$$(docker ps -aq -f name=$(CONTAINER_NAME))" ]; then \
		echo "Stopping existing container..."; \
		docker stop $(CONTAINER_NAME) 2>/dev/null || true; \
		docker rm $(CONTAINER_NAME) 2>/dev/null || true; \
	fi
	docker run -d \
		-p $(PORT):3001 \
		--env-file .env \
		--name $(CONTAINER_NAME) \
		$(IMAGE_NAME)
	@echo ""
	@echo "  → http://localhost:$(PORT)"
	@echo ""

stop: ## Stop and remove the container
	docker stop $(CONTAINER_NAME) 2>/dev/null || true
	docker rm $(CONTAINER_NAME) 2>/dev/null || true

restart: stop run ## Recreate container from current image

logs: ## Follow container logs
	docker logs -f $(CONTAINER_NAME)

shell: ## Debug shell inside running container (as root)
	docker exec -it -u root $(CONTAINER_NAME) /bin/sh

clean: ## Remove the local Docker image
	docker rmi $(IMAGE_NAME) 2>/dev/null || true

##@ Docker Compose

compose-build: ## docker compose build
	$(COMPOSE) -f $(COMPOSE_FILE) build

compose-up: ## Build (if needed) and start in background
	@if [[ ! -f .env ]]; then echo "Missing .env — create one before compose-up."; exit 1; fi
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --build

compose-down: ## Stop and remove containers + network
	$(COMPOSE) -f $(COMPOSE_FILE) down

compose-logs: ## Follow compose logs
	$(COMPOSE) -f $(COMPOSE_FILE) logs -f

compose-ps: ## Service status
	$(COMPOSE) -f $(COMPOSE_FILE) ps

compose-restart: compose-down compose-up ## Full rebuild cycle

# --- LMS-style names ---
prod-up: compose-up ## Alias: docker compose up -d --build
prod-down: compose-down ## Alias: docker compose down
prod-logs: compose-logs ## Alias: docker compose logs -f
