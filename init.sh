#!/usr/bin/env sh

set -e

if [ -n "$ANACLETO_DEBUG" ]; then
  set -x
fi

if [ ! -f "$PWD/.env" ]; then
  sh "$PWD/mkenv.sh"
fi

docker compose run --rm -p 80:80 -p 443:443 certbot /opt/bootstrap.sh
