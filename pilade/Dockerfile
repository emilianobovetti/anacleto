FROM debian:stable-slim AS dev

ARG UID=1000
ARG GID=1000

RUN apt-get update && \
  apt-get install -y gnupg curl && \
  curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor >/etc/apt/trusted.gpg.d/yarn.gpg  && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" >/etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install -y sudo cron nodejs yarn calibre && \
  addgroup --system --gid "$GID" app && \
  adduser --system --uid "$UID" --gid "$GID" app

USER app

COPY --chown=app:app package.json yarn.lock /home/app/pilade/

WORKDIR /home/app/pilade

RUN yarn

FROM dev AS prod

USER root

COPY --chown=app:app src /home/app/pilade/src/
COPY --chown=app:app entrypoint.sh /opt

CMD ["/opt/entrypoint.sh"]
