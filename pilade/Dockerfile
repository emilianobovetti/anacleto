FROM debian:stable-slim AS dev

RUN apt-get update && \
  apt-get install -y gnupg curl && \
  curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor >/etc/apt/trusted.gpg.d/yarn.gpg  && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" >/etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install -y sudo cron nodejs yarn calibre && \
  addgroup --system app && \
  adduser --system --gid "$(getent group app | cut -d: -f3)" app

USER app

COPY --chown=app:app src/package.json src/yarn.lock /home/app/src/

WORKDIR /home/app/src

RUN yarn

FROM dev AS prod

USER root

COPY --chown=app:app src /home/app/src/
COPY --chown=app:app entrypoint.sh /opt

CMD ["/opt/entrypoint.sh"]
