#!/bin/bash
DOMAIN="ayalalangdemo.duckdns.org"
EMAIL="ayalaswisa@proton.me"

# 1. Request the real certificate using webroot mode if we haven't already
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Requesting production Let's Encrypt SSL certificate..."
    
    certbot certonly --webroot \
      -w /var/app/current/public \
      --non-interactive \
      --agree-tos \
      --email "$EMAIL" \
      -d "$DOMAIN"

    # 2. If successful, point our active Nginx paths to the real keys
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
        echo "Linking production certificates..."
        ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/pki/tls/certs/server.crt
        ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/pki/tls/private/server.key
        
        # 3. Reload Nginx to securely apply the trusted cert
        systemctl reload nginx
    fi
fi