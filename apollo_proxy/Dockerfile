#Dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]



# Copy root filesystem
COPY rootfs /

RUN chmod +x /usr/bin/boringproxy