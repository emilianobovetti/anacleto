#!/usr/bin/env sh

if [ -z "$HOME_ASSISTANT_SSH_PUBKEY" ]; then
  echo "Missing mandatory environment variable HOME_ASSISTANT_SSH_PUBKEY" 1>&2
  exit 1
fi

if [ -z "$SSH_PORT" ]; then
  SSH_PORT=22
fi

ssh-keygen -A

mkdir -p /home/semola/.ssh
echo "$HOME_ASSISTANT_SSH_PUBKEY" > /home/semola/.ssh/authorized_keys
chmod 600 /home/semola/.ssh/authorized_keys
chown -R semola /home/semola/.ssh

SSHD_OPTIONS="-D -e"

if [ -n "$DEBUG" ]; then
  SSHD_OPTIONS="-ddd $SSHD_OPTIONS"
fi

exec /usr/sbin/sshd $SSHD_OPTIONS -p "$SSH_PORT"
