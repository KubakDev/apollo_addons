#Dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM

# Set shell
# SHELL ["/bin/bash", "-o", "pipefail", "-c"]



# Copy root filesystem
COPY rootfs /

RUN chmod a+x /etc/services.d/apollo_proxy/run
RUN chmod a+x /etc/services.d/apollo_proxy/finish
RUN chmod +x /usr/bin/boringproxy