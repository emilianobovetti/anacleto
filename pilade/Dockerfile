FROM debian:stable-slim AS dev

ARG APP_UID=1000
ARG APP_GID=1000

ENV PLAYWRIGHT_DEPS \
  libglib2.0-0 \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libatspi2.0-0 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libxcb1 \
  libxkbcommon0 \
  libpango-1.0-0 \
  libcairo2 \
  libasound2

ENV DEBIAN_FRONTEND=noninteractive \
  DEBCONF_NOWARNINGS=yes \
  LANG=C.UTF-8

RUN set -xe \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends \
    sudo \
    cron \
    nodejs \
    $PLAYWRIGHT_DEPS \
  && corepack enable \
  && groupadd --gid "$APP_GID" app \
  && useradd --create-home --home-dir /home/app --uid "$APP_UID" --gid "$APP_GID" app

USER app

COPY --chown=app:app package.json yarn.lock /home/app/pilade/

WORKDIR /home/app/pilade

RUN yarn

FROM dev AS prod

USER root

COPY --chown=app:app src /home/app/pilade/src/
COPY --chown=app:app entrypoint.sh /opt

CMD ["/opt/entrypoint.sh"]
