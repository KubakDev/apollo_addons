#Dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM


# Copy root filesystem
COPY rootfs /

RUN chmod a+x /etc/services.d/apollo_proxy/run
RUN chmod a+x /etc/services.d/apollo_proxy/finish
RUN chmod +x /usr/bin/boringproxy

CMD ["/etc/services.d/apollo_proxy/run"]