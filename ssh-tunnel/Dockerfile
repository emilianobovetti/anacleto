FROM alpine

RUN apk add --no-cache openssh && \
  adduser -D semola && \
  # https://unix.stackexchange.com/a/193131/311426
  sed -i 's/^semola:!/semola:*/' /etc/shadow && \
  ssh-keygen -A

COPY entrypoint.sh /opt

CMD ["/opt/entrypoint.sh"]
