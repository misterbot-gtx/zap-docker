#!/bin/sh
set -e

# Função para escapar caracteres especiais no sed
_escape_sed() {
  printf '%s\n' "$1" | sed 's/[^^]/[&]/g; s/\^/\\^/g; s/[$$\/&]/\\&/g'
}

# Verificar se variáveis obrigatórias estão definidas
REQUIRED_VARS="DB_HOST DB_PORT DB_NAME DB_USER DB_PASS JWT_SECRET REDIS_HOST REDIS_PORT REDIS_PASS"

for VAR in $REQUIRED_VARS; do
  if [ -z "$(eval echo \$$VAR)" ]; then
    echo "Erro: A variável de ambiente $VAR não está definida." >&2
    exit 1
  fi
done

# Aguarda o Postgres estar pronto
echo "Aguardando o Postgres iniciar..."
dockerize -wait tcp://${DB_HOST}:${DB_PORT} -timeout 30s

# Substituição de variáveis nos arquivos (apenas na primeira vez)
if [ -f /usr/src/app/.env_replaced ]; then
  echo "Substituições já realizadas. Pulando etapa de substituição."
else
  _replaceBackendEnvVars() {
    echo "Procurando arquivos para substituição..."

    # Exclui arquivos indesejados da busca (como o próprio script backend.sh)
    FILES=$(grep -rlE "postgres_host_a_ser_mudado|porta_postgres_a_ser_mudada|usuario_postgres_a_ser_mudado|senha_postgres_a_ser_mudado|nome_postgres_a_ser_mudado|fuso_horario_a_ser_mudado|jwt_secreto_a_ser_mudado|jwt_refresh_secreto_a_ser_mudado|porta_backend_a_ser_mudada|porta_proxy_a_ser_mudada|https://api.example.com|https://app.example.com|chrome_args_a_ser_mudado|redis_uri_a_ser_mudado|redis_limiter_max_a_ser_mudado|redis_limiter_duracao_a_ser_mudada|gerencianet_sandbox_a_ser_mudado|gerencianet_client_id_a_ser_mudado|gerencianet_client_secret_a_ser_mudado|gerencianet_pix_cert_a_ser_mudado|gerencianet_pix_key_a_ser_mudado|user_limit_a_ser_mudado|connections_limit_a_ser_mudado|closed_send_by_me_a_ser_mudado|mail_host_a_ser_mudado|mail_user_a_ser_mudado|mail_pass_a_ser_mudado|mail_from_a_ser_mudado|mail_port_a_ser_mudada" /usr/src/app --exclude-dir=node_modules --exclude=backend.sh)

    if [ -z "$FILES" ]; then
      echo "Nenhum arquivo encontrado para substituição."
      return
    fi

    for FILE in $FILES; do
      echo "Substituindo variáveis em $FILE..."

      # Escape das variáveis
      escaped_db_host=$(_escape_sed "$DB_HOST")
      escaped_db_port=$(_escape_sed "$DB_PORT")
      escaped_db_user=$(_escape_sed "$DB_USER")
      escaped_db_pass=$(_escape_sed "$DB_PASS")
      escaped_db_name=$(_escape_sed "$DB_NAME")
      escaped_tz=$(_escape_sed "$TZ")
      escaped_jwt_secret=$(_escape_sed "$JWT_SECRET")
      escaped_jwt_refresh_secret=$(_escape_sed "$JWT_REFRESH_SECRET")
      escaped_port=$(_escape_sed "$PORT")
      escaped_proxy_port=$(_escape_sed "$PROXY_PORT")
      escaped_backend_url=$(_escape_sed "$BACKEND_URL")
      escaped_frontend_url=$(_escape_sed "$FRONTEND_URL")
      escaped_chrome_args=$(_escape_sed "$CHROME_ARGS")
      escaped_redis_uri=$(_escape_sed "$REDIS_URI")
      escaped_redis_opt_limiter_max=$(_escape_sed "$REDIS_OPT_LIMITER_MAX")
      escaped_redis_opt_limiter_duration=$(_escape_sed "$REDIS_OPT_LIMITER_DURATION")
      escaped_gerencianet_sandbox=$(_escape_sed "$GERENCIANET_SANDBOX")
      escaped_gerencianet_client_id=$(_escape_sed "$GERENCIANET_CLIENT_ID")
      escaped_gerencianet_client_secret=$(_escape_sed "$GERENCIANET_CLIENT_SECRET")
      escaped_gerencianet_pix_cert=$(_escape_sed "$GERENCIANET_PIX_CERT")
      escaped_gerencianet_pix_key=$(_escape_sed "$GERENCIANET_PIX_KEY")
      escaped_user_limit=$(_escape_sed "$USER_LIMIT")
      escaped_connections_limit=$(_escape_sed "$CONNECTIONS_LIMIT")
      escaped_closed_send_by_me=$(_escape_sed "$CLOSED_SEND_BY_ME")
      escaped_mail_host=$(_escape_sed "$MAIL_HOST")
      escaped_mail_user=$(_escape_sed "$MAIL_USER")
      escaped_mail_pass=$(_escape_sed "$MAIL_PASS")
      escaped_mail_from=$(_escape_sed "$MAIL_FROM")
      escaped_mail_port=$(_escape_sed "$MAIL_PORT")

      # Substituições
      sed -i "s/postgres_host_a_ser_mudado/${escaped_db_host}/g" "$FILE"
      sed -i "s/porta_postgres_a_ser_mudada/${escaped_db_port}/g" "$FILE"
      sed -i "s/usuario_postgres_a_ser_mudado/${escaped_db_user}/g" "$FILE"
      sed -i "s/senha_postgres_a_ser_mudado/${escaped_db_pass}/g" "$FILE"
      sed -i "s/nome_postgres_a_ser_mudado/${escaped_db_name}/g" "$FILE"
      sed -i "s/fuso_horario_a_ser_mudado/${escaped_tz}/g" "$FILE"
      sed -i "s/jwt_secreto_a_ser_mudado/${escaped_jwt_secret}/g" "$FILE"
      sed -i "s/jwt_refresh_secreto_a_ser_mudado/${escaped_jwt_refresh_secret}/g" "$FILE"
      sed -i "s/porta_backend_a_ser_mudada/${escaped_port}/g" "$FILE"
      sed -i "s/porta_proxy_a_ser_mudada/${escaped_proxy_port}/g" "$FILE"
      sed -i "s|https://api.example.com|${escaped_backend_url}|g" "$FILE"
      sed -i "s|https://app.example.com|${escaped_frontend_url}|g" "$FILE"
      sed -i "s/chrome_args_a_ser_mudado/${escaped_chrome_args}/g" "$FILE"
      sed -i "s/redis_uri_a_ser_mudado/${escaped_redis_uri}/g" "$FILE"
      sed -i "s/redis_limiter_max_a_ser_mudado/${escaped_redis_opt_limiter_max}/g" "$FILE"
      sed -i "s/redis_limiter_duracao_a_ser_mudada/${escaped_redis_opt_limiter_duration}/g" "$FILE"
      sed -i "s/gerencianet_sandbox_a_ser_mudado/${escaped_gerencianet_sandbox}/g" "$FILE"
      sed -i "s/gerencianet_client_id_a_ser_mudado/${escaped_gerencianet_client_id}/g" "$FILE"
      sed -i "s/gerencianet_client_secret_a_ser_mudado/${escaped_gerencianet_client_secret}/g" "$FILE"
      sed -i "s/gerencianet_pix_cert_a_ser_mudado/${escaped_gerencianet_pix_cert}/g" "$FILE"
      sed -i "s/gerencianet_pix_key_a_ser_mudado/${escaped_gerencianet_pix_key}/g" "$FILE"
      sed -i "s/user_limit_a_ser_mudado/${escaped_user_limit}/g" "$FILE"
      sed -i "s/connections_limit_a_ser_mudado/${escaped_connections_limit}/g" "$FILE"
      sed -i "s/closed_send_by_me_a_ser_mudado/${escaped_closed_send_by_me}/g" "$FILE"
      sed -i "s/mail_host_a_ser_mudado/${escaped_mail_host}/g" "$FILE"
      sed -i "s/mail_user_a_ser_mudado/${escaped_mail_user}/g" "$FILE"
      sed -i "s/mail_pass_a_ser_mudado/${escaped_mail_pass}/g" "$FILE"
      sed -i "s/mail_from_a_ser_mudado/${escaped_mail_from}/g" "$FILE"
      sed -i "s/mail_port_a_ser_mudada/${escaped_mail_port}/g" "$FILE"

      echo "$FILE modificado com sucesso."
    done
  }

  _replaceBackendEnvVars

  # Corrigido: usa DB_PASS, não DB_PASSWORD
  DB_URI="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
  echo "PostgreSQL URI construído com sucesso: $DB_URI"

  # Criar arquivo marcador para evitar substituição futura
  touch /usr/src/app/.env_replaced
fi

# Executa migrações do Sequelize (sempre)
echo "Executando migrações do banco de dados..."
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Iniciar o backend
echo "Iniciando aplicação..."
exec node dist/server.js