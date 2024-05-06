# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-dockerfile
# ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Execute during the build of the image
# ARG TEMPIO_VERSION BUILD_ARCH
# RUN \
#     curl -sSLf -o /usr/bin/tempio \
#     "https://github.com/home-assistant/tempio/releases/download/${TEMPIO_VERSION}/tempio_${BUILD_ARCH}"

# Copy root filesystem
COPY rootfs /
# COPY rootfs/usr/src/app/package*.json /
WORKDIR /usr/src/app

# Set shell
# SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN chmod a+x /etc/services.d/apollo_admin/run
RUN chmod a+x /etc/services.d/apollo_admin/finish

RUN npm install

# ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
# # hadolint ignore=DL3006
# FROM ${BUILD_FROM}

# # Copy Node-RED package.json
# COPY package.json /apollo/

# # Set workdir
# WORKDIR /apollo

# # Set shell
# SHELL ["/bin/bash", "-o", "pipefail", "-c"]

