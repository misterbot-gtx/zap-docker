# Etapa de build
FROM node:20-alpine AS build-deps
WORKDIR /usr/src/app

ARG BACKEND_URL
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_HOURS_CLOSE_TICKETS_AUTO

ENV BACKEND_URL=$BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_HOURS_CLOSE_TICKETS_AUTO=$REACT_APP_HOURS_CLOSE_TICKETS_AUTO

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Etapa final
FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache jq nano

# Copia apenas o necessário
COPY --from=build-deps /usr/src/app/build ./build
COPY --from=build-deps /usr/src/app/src ./src
COPY server.js ./
COPY add-env-vars.sh ./
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Permissões
RUN chmod +x add-env-vars.sh

EXPOSE 3250

CMD ["sh", "-c", "sh ./add-env-vars.sh && exec node server.js"]