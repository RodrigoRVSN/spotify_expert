# Baseado na versão 17 do node
FROM node:17-slim

# Atualiza e instala os softwares que precisamos compartilhar com a flag -y (Sim)
RUN apt-get update \
  && apt-get install -y sox libsox-fmt-mp3

# Registra o diretório na pasta spotify-radio
WORKDIR /spotify-radio/

# Copia o package.json e o package-lock.json com as dependencias do projeto no workdir
COPY package.json package-lock.json /spotify-radio/

# Instala as dependencias
RUN npm ci --silent

# Copia os itens para o diretório do container
COPY . .

# Define o usuário
USER node

# Roda o servidor node
CMD npm run live-reload