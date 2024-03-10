#Dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM


# Download and set up boringproxy
RUN curl -LO https://github.com/boringproxy/boringproxy/releases/download/v0.10.0/boringproxy-linux-arm64 \
    && chmod +x boringproxy-linux-arm64 \
    && mv boringproxy-linux-arm64 /usr/bin/boringproxy

# Copy data for add-on
COPY run.sh /
RUN chmod a+x /run.sh


CMD [ "/run.sh" ]