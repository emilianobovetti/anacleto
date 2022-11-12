#!/usr/bin/env sh

APP_ENV="HOME=/home/app $(env | grep '^PILADE_' | tr '\n' ' ')"
JS_ENTRYPOINT=/home/app/pilade/src/index.js
LOG_DIR=/var/log/pilade
LOG_FILE="$LOG_DIR/pilade.log"

mkdir -p "$LOG_DIR"
touch "$LOG_FILE"
chown -R app:app "$LOG_DIR"

echo "00 04 * * * export $APP_ENV; node $JS_ENTRYPOINT >>$LOG_FILE 2>&1" | crontab -

tail -f "$LOG_FILE" &

exec cron -f -L 7
