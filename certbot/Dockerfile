FROM alpine

RUN apk add --no-cache certbot

COPY entrypoint.sh /opt
COPY bootstrap.sh /opt

CMD ["/opt/entrypoint.sh"]
