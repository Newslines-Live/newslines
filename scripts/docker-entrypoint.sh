#!/bin/sh
set -e
mkdir -p /app/public/wp-content
chown -R nextjs:nodejs /app/public/wp-content || true

if [ "${SKIP_WP_MEDIA_SYNC:-}" != "1" ]; then
  su-exec nextjs node /app/download-wp-uploads.mjs \
    >> /app/public/wp-content/download.log 2>&1 &
fi

exec su-exec nextjs node server.js
