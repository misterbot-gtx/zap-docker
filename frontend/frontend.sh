#!/bin/sh

echo "Iniciando container do frontend..."
echo "URL configurada: ${BACKEND_URL}"

CONFIG_FILE="/usr/src/app/build/config.js"

if [ -f "$CONFIG_FILE" ]; then
  echo "Substituindo placeholder no config.js..."
  sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" "$CONFIG_FILE"
else
  echo "Arquivo config.js não encontrado em $CONFIG_FILE"
fi

exec node server.js
