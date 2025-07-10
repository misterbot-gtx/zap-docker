FROM node:20 AS build-deps

# Instala dependências básicas
RUN apt-get update && apt-get install -y \
    wget \
    postgresql-client \
    gnupg \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Instala dockerize
ENV DOCKERIZE_VERSION=v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/${DOCKERIZE_VERSION}/dockerize-linux-amd64-${DOCKERIZE_VERSION}.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-${DOCKERIZE_VERSION}.tar.gz \
    && rm dockerize-linux-amd64-${DOCKERIZE_VERSION}.tar.gz

# Instala dumb-init
ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.1/dumb-init_1.2.1_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

# Previne download automático do Chromium pelo Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

# Instale o CLI globalmente (IMPORTANTE para rodar migrações)
RUN npm install -g sequelize-cli

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV CHROME_BIN=google-chrome-stable

# Copia o script de inicialização
COPY backend.sh ./
RUN chmod +x backend.sh

EXPOSE 3000

# Use apenas o script para controlar a inicialização
CMD ["bash", "-c", "./backend.sh"]