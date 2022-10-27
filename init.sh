#!/usr/bin/env sh

set -e

if [ ! -f "$PWD/.env" ]; then
  sh "$PWD/mkenv.sh"
fi

docker compose run -p 80:80 -p 443:443 certbot /opt/bootstrap.sh
