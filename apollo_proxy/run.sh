#!/usr/bin/with-contenv bashio
#run.sh
# Prepare /data/certs directory and copy existing certs from /etc/ssl/certs
mkdir -p /data/certs
cp -a /etc/ssl/certs/. /data/certs/

# Remove the existing /etc/ssl/certs directory (be very cautious with this step)
rm -rf /etc/ssl/certs

# Create the symlinks correctly

ln -s /data/certs /etc/ssl/certs
ln -s /data/.ssh /home/.ssh

# Your original script content follows
SERVER=$(bashio::config 'server')
TOKEN=$(bashio::config 'token')
CLIENTNAME=$(bashio::config 'clientname')
USER=$(bashio::config 'user')
EMAIL=$(bashio::config 'email')
CERTMAGIC=$(bashio::config 'certmagic')


/usr/bin/boringproxy client -server $SERVER -token $TOKEN -client-name $CLIENTNAME -user $USER -cert-dir $CERTMAGIC -acme-email $EMAIL


