FROM debian:stable-slim AS dev

ARG UID=1000
ARG GID=1000

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

RUN apt-get update && \
  apt-get install -y gnupg curl && \
  curl -fsSL https://deb.nodesource.com/setup_19.x | bash - && \
  curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor >/etc/apt/trusted.gpg.d/yarn.gpg  && \
  echo "deb https://dl.yarnpkg.com/debian/ stable main" >/etc/apt/sources.list.d/yarn.list && \
  apt-get update && \
  apt-get install -y sudo cron nodejs yarn $PLAYWRIGHT_DEPS && \
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
