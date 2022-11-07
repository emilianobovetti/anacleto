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
		--privileged=true \
		--network=host \
		--name=$(APP) \
		--env-file=$(DOTENV) \
		--env=DISPLAY=$(DISPLAY) \
		--env=PILADE_HEADLESS=false \
		--volume="/tmp/.X11-unix:/tmp/.X11-unix:rw" \
		--volume="$(HOME)/.Xauthority:/home/app/.Xauthority" \
		--volume="$(PWD)/src:/home/app/pilade/src" \
		--workdir=/home/app/pilade \
		$(APP) bash

.PHONY: docker-build
docker-build:
	docker build \
		--tag=$(APP) \
		--target=dev \
		--build-arg=UID=$(shell id -u) \
		--build-arg=GID=$(shell id -g) \
		$(PWD)
