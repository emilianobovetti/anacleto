#!/usr/bin/env sh

echo "00 00 * * * nginx -s reload" | crontab -

crond
