#!/usr/bin/env sh

APP_ENV="HOME=/home/app $(env | grep '^PILADE_' | tr '\n' ' ')"

echo "00 04 * * * export $APP_ENV; node /home/app/src/index.js >>/var/log/pilade.log 2>&1" | crontab -

touch /var/log/pilade.log
chown app:app /var/log/pilade.log
tail -f /var/log/pilade.log &

exec cron -f -L 7
