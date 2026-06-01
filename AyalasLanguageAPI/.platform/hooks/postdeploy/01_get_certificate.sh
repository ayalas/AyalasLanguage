#!/bin/bash
# 1. Install Certbot globally via python pip if missing
pip3 install certbot certbot-nginx --quiet

# 2. Obtain the SSL certificate using standard webroot authentication validation
if [ ! -d "/etc/letsencrypt/live/ayalasapp.duckdns.org" ]; then
    echo "Requesting fresh Let's Encrypt SSL configuration..."
    certbot certonly --webroot \
      -w /var/app/current/public \
      --non-interactive \
      --agree-tos \
      --email ayalaswisa@proton.me \
      -d ayalalangdemo.duckdns.org
      
    # 3. Force Nginx to safely reload and pick up the new ssl.conf configuration fragment
    systemctl reload nginx
fi