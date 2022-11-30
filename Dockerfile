FROM node:18.9.0 AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY ./src ./src
RUN npx parcel build --no-source-maps ./src/index.html

FROM nginx:1.23.2-alpine
COPY --from=builder /app/dist /usr/share/nginx/html