# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-dockerfile
# ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
ARG BUILD_FROM=ghcr.io/hassio-addons/base-nodejs:0.2.1
# hadolint ignore=DL3006
FROM ${BUILD_FROM}


# Copy root filesystem
COPY rootfs /
# COPY rootfs/usr/src/app/package*.json /
WORKDIR /usr/src/app

RUN chmod a+x /etc/services.d/apollo_admin/run
RUN chmod a+x /etc/services.d/apollo_admin/finish

RUN npm install

