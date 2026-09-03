#!/bin/sh
set -e

mkdir -p /root/.ssh
chmod 700 /root/.ssh

if [ -n "${KINDLE_SSH_KEY:-}" ]; then
  printf '%s' "$KINDLE_SSH_KEY" | base64 -d > /root/.ssh/id_ed25519
  printf '\n' >> /root/.ssh/id_ed25519
  chmod 600 /root/.ssh/id_ed25519
fi

if [ -n "${KINDLE_SSH_HOSTNAME:-}" ]; then
  case "$KINDLE_SSH_HOSTNAME" in
    *[[:space:]]*)
      echo "KINDLE_SSH_HOSTNAME must not contain whitespace" >&2
      exit 1
      ;;
  esac

  if [ -n "${KINDLE_SSH_USER:-}" ]; then
    case "$KINDLE_SSH_USER" in
      *[[:space:]]*)
        echo "KINDLE_SSH_USER must not contain whitespace" >&2
        exit 1
        ;;
    esac
  fi

  if [ -n "${KINDLE_SSH_PORT:-}" ]; then
    case "$KINDLE_SSH_PORT" in
      ''|*[!0-9]*)
        echo "KINDLE_SSH_PORT must be a number" >&2
        exit 1
        ;;
    esac
    if [ "${#KINDLE_SSH_PORT}" -gt 5 ]; then
      echo "KINDLE_SSH_PORT out of range" >&2
      exit 1
    fi
    if [ "$KINDLE_SSH_PORT" -lt 1 ] || [ "$KINDLE_SSH_PORT" -gt 65535 ]; then
      echo "KINDLE_SSH_PORT out of range" >&2
      exit 1
    fi
  fi

  cat > /root/.ssh/config <<EOF
Host kindle
  HostName ${KINDLE_SSH_HOSTNAME}
  User ${KINDLE_SSH_USER:-root}
  Port ${KINDLE_SSH_PORT:-22}
  IdentityFile /root/.ssh/id_ed25519
  StrictHostKeyChecking accept-new
  UserKnownHostsFile /root/.ssh/known_hosts
  ServerAliveInterval 30
EOF
  chmod 600 /root/.ssh/config
fi

touch /root/.ssh/known_hosts
chmod 600 /root/.ssh/known_hosts

exec "$@"
