FROM node:18.9.0
WORKDIR /app
COPY package.json ./
RUN npm install