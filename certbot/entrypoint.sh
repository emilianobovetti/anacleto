#!/usr/bin/env sh

echo "00 00 * * * certbot renew --webroot -w /var/www/certbot" | crontab -

exec crond -f
