#!/usr/bin/env sh

if [ -z "$HOME_ASSISTANT_SSH_PUBKEY" ]; then
  echo "Missing mandatory environment variable HOME_ASSISTANT_SSH_PUBKEY" 1>&2
  exit 1
fi

if [ -z "$SSH_PORT" ]; then
  SSH_PORT=22
fi

su semola -c 'mkdir -p ~/.ssh'
su semola -c "echo \"$HOME_ASSISTANT_SSH_PUBKEY\" > ~/.ssh/authorized_keys"
su semola -c 'chmod 600 ~/.ssh/authorized_keys'

exec /usr/sbin/sshd -p "$SSH_PORT" -D -e "$@"
