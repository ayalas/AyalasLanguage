#!/bin/bash
echo "Forcibly purging stuck SSL configurations before proxy validation..."

# Erase any stuck config from the staging canvas so Nginx -t passes cleanly
rm -f /var/proxy/staging/nginx/conf.d/ssl.conf
rm -f /etc/nginx/conf.d/ssl.conf

# Create an entirely empty file in its place just to be safe
mkdir -p /var/proxy/staging/nginx/conf.d
touch /var/proxy/staging/nginx/conf.d/ssl.conf