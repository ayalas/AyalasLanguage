#!/bin/bash
DOMAIN="ayalalangdemo.duckdns.org"
EMAIL="ayalaswisa@proton.me"
CONF_FILE="/etc/nginx/conf.d/ssl.conf"

# 1. Install Certbot globally via python pip if missing
pip3 install certbot certbot-nginx --quiet

# 2. Check if the SSL certificate already exists
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "Requesting fresh Let's Encrypt SSL configuration for $DOMAIN..."
    
    # Run certbot using the standalone webroot method while Nginx is running on Port 80
    certbot certonly --webroot \
      -w /var/app/current/public \
      --non-interactive \
      --agree-tos \
      --email "$EMAIL" \
      -d "$DOMAIN"
fi

# 3. If the certificate exists, safely generate the Nginx block dynamically
if [ -d "/etc/letsencrypt/live/$DOMAIN" ] && [ ! -f "$CONF_FILE" ]; then
    echo "Creating secure Nginx server block configuration..."
    
    cat << 'EOF' > "$CONF_FILE"
server {
    listen       443 ssl default_server;
    listen       [::]:443 ssl default_server;
    server_name  localhost;

    ssl_certificate      /etc/letsencrypt/live/ayalalangdemo.duckdns.org/fullchain.pem;
    ssl_certificate_key  /etc/letsencrypt/live/ayalalangdemo.duckdns.org/privkey.pem;

    ssl_session_timeout  5m;
    ssl_protocols  TLSv1.2 TLSv1.3;
    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers   on;

    location / {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
EOF

    # 4. Reload Nginx to activate the new secure routing lane cleanly
    systemctl reload nginx
    echo "HTTPS configuration activated successfully!"
fi