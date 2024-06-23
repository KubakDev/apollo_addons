# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-dockerfile
# ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
# hadolint ignore=DL3006
FROM ${BUILD_FROM}

# Copy root filesystem
COPY rootfs /

RUN chmod a+x /etc/services.d/houstin/run
RUN chmod a+x /etc/services.d/houstin/finish

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./


RUN npm install
