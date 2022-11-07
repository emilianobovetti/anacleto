APP := $(notdir $(PWD))
DOTENV := $(realpath $(PWD)/..)/.env

.PHONY: all
all: docker

.PHONY: docker
docker: docker-build
	docker run \
		--rm \
		--tty=true \
		--interactive=true \
		--name=$(APP) \
		--env-file=$(DOTENV) \
		--volume="$(PWD):/home/app/src" \
		--workdir=/home/app/src \
		$(APP) bash

.PHONY: docker-build
docker-build:
	docker build \
		--tag=$(APP) \
		--target=dev \
		--build-arg=UID=$(shell id -u) \
		--build-arg=GID=$(shell id -g) \
		$(PWD)
