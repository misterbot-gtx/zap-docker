# Etapa de build
FROM node:20-alpine AS build-deps
WORKDIR /usr/src/app

# Argumentos para variáveis de ambiente do frontend
ARG BACKEND_URL
ARG REACT_APP_HOURS_CLOSE_TICKETS_AUTO
ARG REACT_APP_PRIMARY_COLOR
ARG REACT_APP_PRIMARY_DARK
ARG REACT_APP_NUMBER_SUPPORT

# Definindo como variáveis de ambiente (para o build do React)
ENV BACKEND_URL=$BACKEND_URL
ENV REACT_APP_HOURS_CLOSE_TICKETS_AUTO=$REACT_APP_HOURS_CLOSE_TICKETS_AUTO
ENV REACT_APP_PRIMARY_COLOR=$REACT_APP_PRIMARY_COLOR
ENV REACT_APP_PRIMARY_DARK=$REACT_APP_PRIMARY_DARK
ENV REACT_APP_NUMBER_SUPPORT=$REACT_APP_NUMBER_SUPPORT

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . . 
RUN npm run build

# Etapa final
FROM node:20-alpine
WORKDIR /usr/src/app

ARG FROT_PORT
ENV FROT_PORT=${FROT_PORT:-3000}

RUN apk add --no-cache jq nano

COPY --from=build-deps /usr/src/app ./ 

RUN npm install --omit=dev --legacy-peer-deps

# Copia script de inicialização (frontend)
COPY frontend.sh /frontend.sh
RUN chmod +x /frontend.sh

# Porta exposta (informativa)
EXPOSE 3000

# Configuração de entrada do container
ENTRYPOINT ["/frontend.sh"]
