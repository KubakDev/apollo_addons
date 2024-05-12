#Dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM

# Set shell
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

# Execute during the build of the image
ARG TEMPIO_VERSION BUILD_ARCH
RUN \
    curl -sSLf -o /usr/bin/tempio \
    "https://github.com/home-assistant/tempio/releases/download/${TEMPIO_VERSION}/tempio_${BUILD_ARCH}"



# Copy root filesystem
COPY rootfs /

RUN chmod a+x /etc/services.d/apollo_proxy/run
RUN chmod a+x /etc/services.d/apollo_proxy/finish
RUN chmod +x /usr/bin/boringproxy