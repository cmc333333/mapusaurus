#!/bin/sh
set -euo pipefail

sed "s/NGINX_HOST/${NGINX_HOST}/g" /etc/nginx/nginx.conf.tpl > /etc/nginx/nginx.conf
nginx -g 'daemon off;'
