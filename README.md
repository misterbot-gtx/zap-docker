# Whaticket - Instalação com Docker

Este guia vai te ajudar a subir toda a aplicação Whaticket (Frontend, Backend, Redis e Postgres) usando Docker e Docker Compose.

## Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Arquivo `.env` criado na raiz com as seguintes variáveis:

### Exemplo de .env

DB_NAME=whaticket
DB_USER=postgres
DB_PASS=senha123

PORT=3000
PROXY_PORT=3000
BACKEND_URL_BACKEND=http://localhost:3000
FRONTEND_URL=http://localhost:3000

JWT_SECRET=sua_chave_secreta
JWT_REFRESH_SECRET=sua_chave_refresh

CHROME_ARGS=--no-sandbox

REDIS_OPT_LIMITER_MAX=10
REDIS_OPT_LIMITER_DURATION=1000

GERENCIANET_SANDBOX=true
GERENCIANET_CLIENT_ID=seu_client_id
GERENCIANET_CLIENT_SECRET=seu_client_secret
GERENCIANET_PIX_CERT=/caminho/certificado.p12
GERENCIANET_PIX_KEY=/caminho/key.key

USER_LIMIT=10
CONNECTIONS_LIMIT=20
CLOSED_SEND_BY_ME=false

MAIL_HOST=smtp.seudominio.com
MAIL_USER=seu@email.com
MAIL_PASS=senha_email
MAIL_FROM=seu@email.com
MAIL_PORT=587

REACT_APP_BACKEND_URL=http://localhost:3000
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24

## Passo a passo

1. Clone o repositório:

