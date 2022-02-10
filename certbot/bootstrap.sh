#!/usr/bin/env sh

if [ -z "$CERTBOT_CERTNAME" ]; then
  echo "Missing mandatory environment variable CERTBOT_CERTNAME" 1>&2
  exit 1
fi

if [ -z "$CERTBOT_DOMAINS" ]; then
  echo "Missing mandatory environment variable CERTBOT_DOMAINS" 1>&2
  exit 1
fi

if [ -z "$CERTBOT_EMAIL" ]; then
  echo "Missing mandatory environment variable CERTBOT_EMAIL" 1>&2
  exit 1
fi

certbot certonly \
  --standalone \
  --agree-tos \
  --non-interactive \
  --cert-name "$CERTBOT_CERTNAME" \
  --domains "$CERTBOT_DOMAINS" \
  --email "$CERTBOT_EMAIL"
