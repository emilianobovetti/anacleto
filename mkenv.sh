#!/usr/bin/env sh

set -e

if [ -n "$ANACLETO_DEBUG" ]; then
  set -x
fi

alias errecho="echo 1>&2"

ask_help()
{
  echo "Usage: ask [OPTION] [PROMPT]"
  echo
  echo "Options:"
  echo "  -h, --help                 print this guy"
  echo "  -n, --non-empty            read non empty string"
  echo "  -yn                        [y/n]"
  echo "  -Yn                        [y/n] - default yes"
  echo "  -yN                        [y/n] - default no"
}

ask_non_empty()
{
  ASK_PROMPT="$1 →"

  while true; do
    errecho -n "$ASK_PROMPT "
    read -r ASK_INPUT

    # Trim the input
    ASK_INPUT="$(echo "$ASK_INPUT")"

    if [ -n "$ASK_INPUT" ]; then
      break
    fi
  done

  echo "$ASK_INPUT"

  unset ASK_PROMPT
  unset ASK_INPUT
}

ask_yn()
{
  case "$1" in
    -y)
      ASK_PROMPT="$2 [Y/n] →"
      ASK_DEFAULT=yes
      ;;
    -n)
      ASK_PROMPT="$2 [y/N] →"
      ASK_DEFAULT=no
      ;;
    *)
      ASK_PROMPT="$1 [y/n] →"
  esac

  while [ -z "$ASK_INPUT" ]; do
    errecho -n "$ASK_PROMPT "
    read -r ASK_INPUT

    # Trim the input and translate it to lowercase.
    ASK_INPUT="$(echo "$ASK_INPUT" | tr /A-Z/ /a-z/)"

    if [ -z "$ASK_INPUT" ] && [ -n "$ASK_DEFAULT" ]; then
      ASK_INPUT="$ASK_DEFAULT"
    fi

    if [ "$ASK_INPUT" = n ] || [ "$ASK_INPUT" = no ]; then
      echo no
    elif [ "$ASK_INPUT" = y ] || [ "$ASK_INPUT" = yes ]; then
      echo yes
    else
      unset ASK_INPUT
    fi
  done

  unset ASK_PROMPT
  unset ASK_DEFAULT
  unset ASK_INPUT
}

ask()
{
  case "$1" in
    -h|--help)
      ask_help
      ;;
    -n|--non-empty)
      ask_non_empty "$2"
      ;;
    -yn)
      ask_yn "$2"
      ;;
    -Yn)
      ask_yn -y "$2"
      ;;
    -yN)
      ask_yn -n "$2"
      ;;
    *)
      ask_help 1>&2
      return 64
      ;;
  esac
}

ranstr_help()
{
  echo "Usage: ranstr [OPTION]..."
  echo
  echo "Options:"
  echo "  -h, --help                 print this guy"
  echo "  -l, --len, --length        string length, default 15"
  echo "  -r, --rules                character set (see tr manual), default [:graph:]"
  echo "  -d, --dev                  pseudorandom generator device, default /dev/urandom"
  echo
  echo "E.g.:"
  echo "  ranstr --len 10 --rules 0-9A-Za-z --dev /dev/random"
}

ranstr()
{
  RANSTR_LENGTH=15
  RANSTR_RULES=[:graph:]
  RANSTR_DEV=/dev/urandom

  while [ $# -gt 0 ]; do
    case "$1" in
      -h|--help)
        ranstr_help
        return 0
        ;;
      -l|--len|--length)
        RANSTR_LENGTH="$2"
        shift
        ;;
      -r|--rules)
        RANSTR_RULES="$2"
        shift
        ;;
      -d|--dev)
        RANSTR_DEV="$2"
        shift
        ;;
      *)
        ranstr_help 1>&2
        return 64
        ;;
      esac

      shift
  done

  tr -dc "$RANSTR_RULES" < "$RANSTR_DEV" | head -c "$RANSTR_LENGTH"

  unset RANSTR_LENGTH
  unset RANSTR_RULES
  unset RANSTR_DEV
}

env_certbot()
{
  if [ -z "$CERTBOT_CERTNAME" ] || [ -z "$CERTBOT_DOMAINS" ] || [ -z "$CERTBOT_EMAIL" ]; then
    errecho " ╔═════════╗ "
    errecho " ╟ Certbot ╢ "
    errecho " ╚═════════╝ "
    errecho
  fi

  if [ -z "$CERTBOT_CERTNAME" ]; then
    errecho "Check --cert-name at https://certbot.eff.org/docs/using.html#certbot-command-line-options"
    CERTBOT_CERTNAME="$(ask -n "Certificate name")"
  fi

  if [ -z "$CERTBOT_DOMAINS" ]; then
    errecho "Check --domains at https://certbot.eff.org/docs/using.html#certbot-command-line-options"
    errecho "  (e.g.: sub1.example.com,sub2.example.com)"
    CERTBOT_DOMAINS="$(ask -n "Domains")"
  fi

  if [ -z "$CERTBOT_EMAIL" ]; then
    errecho "Check --email at https://certbot.eff.org/docs/using.html#certbot-command-line-options"
    CERTBOT_EMAIL="$(ask -n "Email")"
  fi

  echo "CERTBOT_CERTNAME=$CERTBOT_CERTNAME"
  echo "CERTBOT_DOMAINS=$CERTBOT_DOMAINS"
  echo "CERTBOT_EMAIL=$CERTBOT_EMAIL"
  echo
}

env_drone()
{
  if [ -z "$DRONE_GITHUB_CLIENT_ID" ] || [ -z "$DRONE_GITHUB_CLIENT_SECRET" ] || [ -z "$DRONE_RPC_SECRET" ]; then
    errecho " ╔═══════╗ "
    errecho " ╟ Drone ╢ "
    errecho " ╚═══════╝ "
    errecho
  fi

  if [ -z "$DRONE_GITHUB_CLIENT_ID" ] || [ -z "$DRONE_GITHUB_CLIENT_SECRET" ]; then
    errecho
    errecho "Go to https://github.com/settings/applications/new"
    errecho "to register a new OAuth application"
    errecho "ref: https://docs.drone.io/server/provider/github#create-an-oauth-application"
    errecho

    DRONE_GITHUB_CLIENT_ID="$(ask -n "Github client ID")"
    DRONE_GITHUB_CLIENT_SECRET="$(ask -n "Github client secret")"
  fi

  if [ -z "$DRONE_RPC_SECRET" ]; then
    DRONE_RPC_SECRET=$(ranstr --length 30 --rules 0-9A-Za-z)
  fi

  echo "DRONE_GITHUB_CLIENT_ID=$DRONE_GITHUB_CLIENT_ID"
  echo "DRONE_GITHUB_CLIENT_SECRET=$DRONE_GITHUB_CLIENT_SECRET"
  echo "DRONE_RPC_SECRET=$DRONE_RPC_SECRET"
  echo
}

env_home_assistant()
{
  if [ -z "$HOME_ASSISTANT_SSH_PUBKEY" ]; then
    errecho " ╔════════════════╗ "
    errecho " ╟ Home Assistant ╢ "
    errecho " ╚════════════════╝ "
    errecho
  fi

  if [ -z "$HOME_ASSISTANT_SSH_PUBKEY" ]; then
    errecho
    errecho "I need the SSH public key to authorize"
    errecho "ssh port forwarding"
    errecho "You may want to run something like this:"
    errecho "ssh-keygen -t ed25519 -C me@mail.example"
    errecho

    HOME_ASSISTANT_SSH_PUBKEY="$(ask -n "SSH public key")"
  fi

  echo "HOME_ASSISTANT_SSH_PUBKEY=$HOME_ASSISTANT_SSH_PUBKEY"
  echo
}

env_pihole()
{
  if [ -z "$PIHOLE_WEBPASSWORD" ]; then
    errecho " ╔═════════╗ "
    errecho " ╟ Pi-hole ╢ "
    errecho " ╚═════════╝ "
    errecho
  fi

  if [ -z "$PIHOLE_WEBPASSWORD" ]; then
    errecho
    errecho "Set an admin password for pi-hole web interface"
    errecho

    PIHOLE_WEBPASSWORD="$(ask -n "web password")"
  fi

  echo "PIHOLE_WEBPASSWORD=$PIHOLE_WEBPASSWORD"
  echo
}

env_pilade()
{
  if [ -z "$PILADE_NEWSPAPER_USERNAME" ] || \
      [ -z "$PILADE_NEWSPAPER_PASSWORD" ] || \
      [ -z "$PILADE_SMTP_HOST" ] || \
      [ -z "$PILADE_SMTP_USERNAME" ] || \
      [ -z "$PILADE_SMTP_PASSWORD" ] || \
      [ -z "$PILADE_RECIPIENTS" ]; then
    errecho " ╔════════════╗ "
    errecho " ╟ Set Pilade ╢ "
    errecho " ╚════════════╝ "
    errecho
  fi

  if [ -z "$PILADE_NEWSPAPER_USERNAME" ]; then
    PILADE_NEWSPAPER_USERNAME="$(ask -n "ilfattoquotidiano.it username")"
  fi

  if [ -z "$PILADE_NEWSPAPER_PASSWORD" ]; then
    PILADE_NEWSPAPER_PASSWORD="$(ask -n "ilfattoquotidiano.it password")"
  fi

  if [ -z "$PILADE_SMTP_HOST" ]; then
    PILADE_SMTP_HOST="$(ask -n "SMTP hostname (something like smtp.gmail.com)")"
  fi

  if [ -z "$PILADE_SMTP_USERNAME" ]; then
    PILADE_SMTP_USERNAME="$(ask -n "SMTP username (like your gmail address)")"
  fi

  if [ -z "$PILADE_SMTP_PASSWORD" ]; then
    PILADE_SMTP_PASSWORD="$(ask -n "SMTP password (go to myaccount.google.com/apppasswords)")"
  fi

  if [ -z "$PILADE_RECIPIENTS" ]; then
    PILADE_RECIPIENTS="$(ask -n "Comma-separated email addresses list")"
  fi

  echo "PILADE_NEWSPAPER_USERNAME=$PILADE_NEWSPAPER_USERNAME"
  echo "PILADE_NEWSPAPER_PASSWORD=$PILADE_NEWSPAPER_PASSWORD"
  echo "PILADE_SMTP_HOST=$PILADE_SMTP_HOST"
  echo "PILADE_SMTP_USERNAME=$PILADE_SMTP_USERNAME"
  echo "PILADE_SMTP_PASSWORD=$PILADE_SMTP_PASSWORD"
  echo "PILADE_RECIPIENTS=$PILADE_RECIPIENTS"
  echo
}

check_current_dotenv()
{
  if [ ! -f "$PWD/.env" ]; then
    if [ -f "$PWD/.env.bak" ]; then
      errecho ".env is missing while .env.bak exists"
      errecho "Please restore your .env or move your .env.bak before proceeding"
      return 1
    else
      return 0
    fi
  fi

  if [ $(ask -yN "Do you want to replace your existing .env?") = no ]; then
    return 1
  fi

  if [ $(ask -yN "Overwrite variables defined in your existing .env?") = no ]; then
    . "$PWD/.env"
  fi

  if [ -n "$(cat "$PWD/.env")" ]; then
    mv "$PWD/.env" "$PWD/.env.bak"
  fi
}

NGINX_DOMAIN_LIST="$(find "$PWD/nginx/etc/nginx/conf.d" -name "*.conf" -exec sed -n "s/^\s*server_name \([^ ;]*\).*$/\1/p" {} +)"
CERTBOT_DOMAINS="$(echo "$NGINX_DOMAIN_LIST" | paste -sd "," -)"

# Provide some defaults, they are hardcoded in config files anyway
CERTBOT_CERTNAME="tno.sh"


if check_current_dotenv; then
  env_certbot >> "$PWD/.env"
  env_drone >> "$PWD/.env"
  env_home_assistant >> "$PWD/.env"
  env_pihole >> "$PWD/.env"
  env_pilade >> "$PWD/.env"
else
  exit $?
fi
